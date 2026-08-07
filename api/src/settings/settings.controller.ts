import { Controller, Get, Put, Body, OnModuleInit } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController implements OnModuleInit {
  constructor(private readonly settingsService: SettingsService) {}

  async onModuleInit() {
    const existing = await this.settingsService.getAll();
    if (Object.keys(existing).length === 0) {
      const defaults: Record<string, string> = {
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
        CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || '',
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
        SUDOMOCK_API_KEY: process.env.SUDOMOCK_API_KEY || '',
      };
      await this.settingsService.setMany(defaults);
    }
  }

  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Put()
  update(@Body() body: Record<string, string>) {
    return this.settingsService.setMany(body);
  }

  @Get('validate/sudomock')
  async validateSudomock() {
    const apiKey = this.settingsService.get('SUDOMOCK_API_KEY');
    if (!apiKey) {
      return { success: false, error: 'API Key no configurada' };
    }

    const response = await fetch('https://api.sudomock.com/api/v1/me', {
      headers: { 'x-api-key': apiKey },
    });

    if (!response.ok) {
      return { success: false, error: 'API Key inválida' };
    }

    const data = await response.json();
    return { success: true, data: data.data };
  }
}
