import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { StoreConfig } from './store.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([StoreConfig]), SettingsModule],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}
