import { Module } from '@nestjs/common';
import { MockupController } from './mockup.controller';
import { MockupService } from './mockup.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [MockupController],
  providers: [MockupService],
  exports: [MockupService],
})
export class MockupModule {}
