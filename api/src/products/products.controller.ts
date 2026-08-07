import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from './enums/category.enum';
import { Style } from './enums/style.enum';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('orientation') orientation: 'vertical' | 'horizontal',
  ) {
    return this.productsService.processAndCreate(
      file.buffer,
      orientation,
    );
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll(
    @Query('category') category?: Category,
    @Query('style') style?: Style,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Si se piden page/limit, usar endpoint paginado
    if (page || limit) {
      const p = Math.max(1, parseInt(page || '1', 10));
      const l = Math.min(50, Math.max(1, parseInt(limit || '20', 10)));
      return this.productsService.findPaginated(p, l, category, style);
    }

    if (category && style) {
      return this.productsService.findByCategoryAndStyle(category, style);
    }
    if (category) {
      return this.productsService.findByCategory(category);
    }
    if (style) {
      return this.productsService.findByStyle(style);
    }
    return this.productsService.findAll();
  }

  // Búsqueda semántica
  @Get('search')
  search(@Query('q') query: string, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.productsService.semanticSearch(query, limit || 10, offset || 0);
  }

  // Búsqueda por similitud a un producto existente (usa su embedding, sin regenerar)
  @Get('similar/:id')
  similar(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.productsService.findSimilar(id, limit || 10, offset || 0);
  }

  // Opciones de filtro para el frontend
  @Get('filters')
  getFilters() {
    return this.productsService.getFilters();
  }

  @Post('regenerate-embeddings')
  regenerateEmbeddings() {
    return this.productsService.regenerateEmbeddings();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
