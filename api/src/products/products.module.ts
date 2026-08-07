import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { EmbeddingService } from './embedding.service';
import { VectorSearchService } from './vector-search.service';
import { ImageAnalysisService } from './image-analysis.service';
import { CloudinaryService } from './cloudinary.service';
import { MockupModule } from '../mockup/mockup.module';
import { MockupsModule } from '../mockups/mockups.module';
import { SettingsModule } from '../settings/settings.module';
import { Product } from './entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), MockupModule, MockupsModule, SettingsModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    EmbeddingService,
    VectorSearchService,
    ImageAnalysisService,
    CloudinaryService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
