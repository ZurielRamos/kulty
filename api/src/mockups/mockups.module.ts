import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MockupsController } from './mockups.controller';
import { MockupsService } from './mockups.service';
import { Mockup } from './mockups.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mockup]), SettingsModule],
  controllers: [MockupsController],
  providers: [MockupsService],
  exports: [MockupsService],
})
export class MockupsModule {}
