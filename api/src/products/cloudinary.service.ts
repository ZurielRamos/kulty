import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly settings: SettingsService) {}

  async uploadBuffer(buffer: Buffer): Promise<string> {
    const base64 = buffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64}`;
    return this.upload(dataUri);
  }

  async upload(file: string): Promise<string> {
    const cloudName = this.settings.get('CLOUDINARY_CLOUD_NAME');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file,
          upload_preset: this.settings.get('CLOUDINARY_UPLOAD_PRESET'),
          api_key: this.settings.get('CLOUDINARY_API_KEY'),
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      this.logger.error(`Cloudinary error: ${JSON.stringify(error)}`);
      throw new Error(
        `Error al subir a Cloudinary: ${error?.error?.message || response.statusText}`,
      );
    }

    const data = await response.json();
    return data.secure_url;
  }
}
