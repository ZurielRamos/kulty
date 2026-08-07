import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoreService } from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  get() {
    return this.storeService.get();
  }

  @Put()
  update(
    @Body()
    body: {
      phone?: string;
      instagram?: string;
      facebook?: string;
      tiktok?: string;
      prices?: { size: string; price: number }[];
    },
  ) {
    return this.storeService.update(body);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    return this.storeService.uploadLogo(file.buffer);
  }
}
