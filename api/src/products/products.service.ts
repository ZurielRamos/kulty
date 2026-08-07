import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from './enums/category.enum';
import { Style } from './enums/style.enum';
import { EmbeddingService } from './embedding.service';
import { VectorSearchService } from './vector-search.service';
import { ImageAnalysisService } from './image-analysis.service';
import { CloudinaryService } from './cloudinary.service';
import { MockupService } from '../mockup/mockup.service';
import { MockupsService } from '../mockups/mockups.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearchService: VectorSearchService,
    private readonly imageAnalysisService: ImageAnalysisService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly mockupService: MockupService,
    private readonly mockupsService: MockupsService,
    private readonly settings: SettingsService,
  ) {}

  /**
   * Recibe la imagen, hace todo el proceso y crea el producto
   */
  async processAndCreate(
    imageBuffer: Buffer,
    orientation: 'vertical' | 'horizontal',
  ): Promise<Product> {
    // 1. Seleccionar un mockup al azar según orientación
    const mockups = await this.mockupsService.findByType(orientation);
    if (mockups.length === 0) {
      throw new Error(`No hay mockups configurados para orientación "${orientation}"`);
    }
    const mockup = mockups[Math.floor(Math.random() * mockups.length)];

    // 2. Subir arte a Cloudinary
    const artImageUrl = await this.cloudinaryService.uploadBuffer(imageBuffer);

    // 3. Generar mockup (Sudomock + subir resultado a Cloudinary)
    const mockupImageUrl = await this.mockupService.generateMockup(
      artImageUrl,
      { mockupUuid: mockup.mockupUuid, smartObjectUuid: mockup.smartObjectUuid },
    );

    // 4. Analizar imagen con IA
    const base64 = imageBuffer.toString('base64');
    const analysis = await this.imageAnalysisService.analyze(base64);

    // 5. Crear producto
    const product = this.productRepo.create({
      title: analysis.title,
      description: analysis.description,
      category: analysis.category,
      style: analysis.style,
      orientation,
      gallery: [artImageUrl, mockupImageUrl],
      embeddingText: analysis.embeddingText,
      mockup: this.settings.get('SUDOMOCK_PLAN') || 'free',
      mockupId: mockup.id,
    });
    const saved = await this.productRepo.save(product);

    // 6. Generar y almacenar embedding (no bloquea si falla)
    try {
      const embedding = await this.embeddingService.generateEmbedding(
        analysis.embeddingText,
      );
      await this.vectorSearchService.upsertEmbedding(saved.id, embedding);
    } catch (error) {
      // El producto se creó pero sin embedding - se puede regenerar después
      console.error(`Error generando embedding para producto ${saved.id}:`, error.message);
    }

    return saved;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const embeddingText = this.embeddingService.buildProductText(dto);
    const product = this.productRepo.create({ ...dto, embeddingText });
    const saved = await this.productRepo.save(product);

    const embedding = await this.embeddingService.generateEmbedding(embeddingText);
    await this.vectorSearchService.upsertEmbedding(saved.id, embedding);

    return saved;
  }

  findAll(): Promise<Product[]> {
    return this.productRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findPaginated(
    page: number,
    limit: number,
    category?: Category,
    style?: Style,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (style) where.style = style;

    const [data, total] = await this.productRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findByCategory(category: Category): Promise<Product[]> {
    return this.productRepo.find({
      where: { category, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  findByStyle(style: Style): Promise<Product[]> {
    return this.productRepo.find({
      where: { style, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  findByCategoryAndStyle(category: Category, style: Style): Promise<Product[]> {
    return this.productRepo.find({
      where: { category, style, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return product;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    await this.findOne(id);
    await this.productRepo.update(id, dto);
    const updated = await this.findOne(id);

    if (dto.title || dto.description || dto.category || dto.style) {
      const embeddingText = this.embeddingService.buildProductText(updated);
      await this.productRepo.update(id, { embeddingText });
      const embedding =
        await this.embeddingService.generateEmbedding(embeddingText);
      await this.vectorSearchService.upsertEmbedding(id, embedding);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.vectorSearchService.deleteEmbedding(id);
    await this.productRepo.delete(id);
  }

  async semanticSearch(query: string, limit = 10): Promise<Product[]> {
    const queryEmbedding =
      await this.embeddingService.generateEmbedding(query);
    const productIds = await this.vectorSearchService.searchSimilar(
      queryEmbedding,
      limit,
    );

    if (productIds.length === 0) return [];

    const products = await this.productRepo.find({
      where: { id: In(productIds), isActive: true },
    });

    return productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
  }

  getFilters() {
    return {
      categories: Object.values(Category),
      styles: Object.values(Style),
    };
  }

  /**
   * Regenera embeddings para productos que no lo tienen
   */
  async regenerateEmbeddings() {
    const products = await this.dataSource.query(
      `SELECT id, "embeddingText" FROM products WHERE embedding_vector IS NULL AND "embeddingText" IS NOT NULL`,
    );

    let success = 0;
    let failed = 0;

    for (const product of products) {
      try {
        const embedding = await this.embeddingService.generateEmbedding(product.embeddingText);
        await this.vectorSearchService.upsertEmbedding(product.id, embedding);
        success++;
      } catch {
        failed++;
      }
    }

    return { total: products.length, success, failed };
  }
}
