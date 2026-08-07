import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BatchService } from './batch.service';

@Controller('batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get('active')
  getActive() {
    return this.batchService.getActive();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.batchService.getById(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.batchService.startBatch(file.buffer);
  }
}
