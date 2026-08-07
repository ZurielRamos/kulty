import { Controller, Post, Body } from '@nestjs/common';
import { IsString } from 'class-validator';
import { MockupService } from './mockup.service';

class GenerateMockupDto {
  @IsString()
  artImageUrl: string;

  @IsString()
  mockupUuid: string;

  @IsString()
  smartObjectUuid: string;
}

@Controller('mockup')
export class MockupController {
  constructor(private readonly mockupService: MockupService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateMockupDto) {
    const resultUrl = await this.mockupService.generateMockup(
      dto.artImageUrl,
      {
        mockupUuid: dto.mockupUuid,
        smartObjectUuid: dto.smartObjectUuid,
      },
    );
    return { resultUrl };
  }
}
