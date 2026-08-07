import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { Batch } from './batch.entity';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([Batch]), ProductsModule],
  controllers: [BatchController],
  providers: [BatchService],
})
export class BatchModule {}
