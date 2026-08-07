import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

interface MockupTemplate {
  mockupUuid: string;
  smartObjectUuid: string;
}

@Injectable()
export class MockupService {
  private readonly logger = new Logger(MockupService.name);

  constructor(private readonly settings: SettingsService) {}

  async generateMockup(
    artImageUrl: string,
    template: MockupTemplate,
  ): Promise<string> {
    // 1. Generar mockup en Sudomock
    const response = await fetch('https://api.sudomock.com/api/v1/renders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.settings.get('SUDOMOCK_API_KEY'),
      },
      body: JSON.stringify({
        mockup_uuid: template.mockupUuid,
        smart_objects: [
          {
            uuid: template.smartObjectUuid,
            asset: {
              url: artImageUrl,
              fit: 'cover',
            },
          },
        ],
        export_options: {
          image_format: 'webp',
          image_size: 1080,
          quality: 90,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      this.logger.error(`Sudomock error: ${JSON.stringify(error)}`);
      throw new Error(
        `Error al generar mockup: ${error?.detail || response.statusText}`,
      );
    }

    const data = await response.json();
    const sudomockUrl = data.data.print_files[0].export_path;

    // 2. Subir a Cloudinary para almacenamiento permanente
    const cloudName = this.settings.get('CLOUDINARY_CLOUD_NAME');
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: sudomockUrl,
          upload_preset: this.settings.get('CLOUDINARY_UPLOAD_PRESET'),
          api_key: this.settings.get('CLOUDINARY_API_KEY'),
        }),
      },
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json().catch(() => null);
      this.logger.error(`Cloudinary error: ${JSON.stringify(error)}`);
      throw new Error('Error al subir mockup a Cloudinary');
    }

    const uploadData = await uploadResponse.json();
    return uploadData.secure_url;
  }
}
