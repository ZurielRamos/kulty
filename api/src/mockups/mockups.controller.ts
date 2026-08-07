import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsString, IsIn, IsOptional } from 'class-validator';
import { MockupsService } from './mockups.service';
import type { MockupType, MockupQuality } from './mockups.entity';

class CreateMockupDto {
  @IsString()
  title: string;

  @IsIn(['vertical', 'horizontal', 'cuadrado'])
  type: MockupType;

  @IsIn(['baja', 'media', 'alta'])
  quality: MockupQuality;

  @IsString()
  mockupUuid: string;

  @IsString()
  smartObjectUuid: string;

  @IsString()
  previewUrl: string;
}

@Controller('mockups')
export class MockupsController {
  constructor(private readonly mockupsService: MockupsService) {}

  @Get()
  findAll() {
    return this.mockupsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateMockupDto) {
    return this.mockupsService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mockupsService.remove(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateMockupDto) {
    return this.mockupsService.update(id, dto);
  }

  @Post(':id/preview')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPreview(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mockupsService.uploadPreview(id, file.buffer);
  }
}
