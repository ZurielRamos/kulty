import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import AdmZip from 'adm-zip';
import { Batch } from './batch.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    private readonly productsService: ProductsService,
  ) {}

  async getActive(): Promise<Batch | null> {
    return this.batchRepo.findOne({
      where: [{ status: 'pending' }, { status: 'processing' }],
      order: { createdAt: 'DESC' },
    });
  }

  async getById(id: number): Promise<Batch | null> {
    return this.batchRepo.findOne({ where: { id } });
  }

  async startBatch(zipBuffer: Buffer): Promise<Batch> {
    // Extraer imágenes del zip
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries().filter((entry) => {
      const name = entry.entryName.toLowerCase();
      return (
        !entry.isDirectory &&
        !name.startsWith('__macosx') &&
        !name.startsWith('.') &&
        (name.endsWith('.jpg') ||
          name.endsWith('.jpeg') ||
          name.endsWith('.png') ||
          name.endsWith('.webp'))
      );
    });

    if (entries.length === 0) {
      throw new Error('No se encontraron imágenes en el ZIP');
    }

    // Crear batch
    const batch = this.batchRepo.create({
      total: entries.length,
      status: 'processing',
    });
    const saved = await this.batchRepo.save(batch);

    // Procesar en background (no await)
    this.processInBackground(saved.id, entries);

    return saved;
  }

  private async processInBackground(
    batchId: number,
    entries: AdmZip.IZipEntry[],
  ) {
    for (const entry of entries) {
      try {
        const batch = await this.batchRepo.findOne({ where: { id: batchId } });
        if (!batch || batch.status === 'failed') break;

        // Actualizar archivo actual
        await this.batchRepo.update(batchId, {
          currentFile: entry.entryName,
        });

        const buffer = entry.getData();

        // Detectar orientación por dimensiones
        const orientation = await this.detectOrientation(buffer);

        // Crear producto
        await this.productsService.processAndCreate(buffer, orientation);

        // Actualizar progreso
        await this.batchRepo.increment({ id: batchId }, 'processed', 1);

        this.logger.log(
          `Batch ${batchId}: procesado ${entry.entryName}`,
        );
      } catch (error) {
        this.logger.error(
          `Batch ${batchId}: error en ${entry.entryName} - ${error.message}`,
        );

        await this.batchRepo.increment({ id: batchId }, 'failed', 1);
        await this.batchRepo.increment({ id: batchId }, 'processed', 1);

        // Guardar error
        const batch = await this.batchRepo.findOne({ where: { id: batchId } });
        if (batch) {
          const errors = [...(batch.errors || []), `${entry.entryName}: ${error.message}`];
          await this.batchRepo.update(batchId, { errors });
        }
      }
    }

    // Marcar como completado
    await this.batchRepo.update(batchId, {
      status: 'completed',
      currentFile: '',
    });

    this.logger.log(`Batch ${batchId}: completado`);
  }

  private detectOrientation(buffer: Buffer): Promise<'vertical' | 'horizontal'> {
    return new Promise((resolve) => {
      // Leer dimensiones del header de la imagen
      // PNG: bytes 16-23 tienen width y height
      // JPEG: más complejo, fallback a vertical
      if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        // PNG
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(24);
        resolve(width >= height ? 'horizontal' : 'vertical');
      } else {
        // JPEG/otros: intentar leer SOF marker
        let i = 2;
        while (i < buffer.length - 9) {
          if (buffer[i] === 0xff) {
            const marker = buffer[i + 1];
            if (marker >= 0xc0 && marker <= 0xc3) {
              const height = buffer.readUInt16BE(i + 5);
              const width = buffer.readUInt16BE(i + 7);
              resolve(width >= height ? 'horizontal' : 'vertical');
              return;
            }
            const segLen = buffer.readUInt16BE(i + 2);
            i += 2 + segLen;
          } else {
            i++;
          }
        }
        resolve('vertical');
      }
    });
  }
}
