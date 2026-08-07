import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreConfig } from './store.entity';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(StoreConfig)
    private readonly storeRepo: Repository<StoreConfig>,
    private readonly settings: SettingsService,
  ) {}

  async get(): Promise<StoreConfig> {
    let config = await this.storeRepo.findOne({ where: { id: 'main' } });
    if (!config) {
      config = this.storeRepo.create({ id: 'main' });
      await this.storeRepo.save(config);
    }
    return config;
  }

  async update(data: Partial<{
    phone: string;
    instagram: string;
    facebook: string;
    tiktok: string;
    prices: { size: string; price: number }[];
  }>): Promise<StoreConfig> {
    await this.storeRepo.upsert({ id: 'main', ...data }, ['id']);
    return this.get();
  }

  async uploadLogo(buffer: Buffer): Promise<StoreConfig> {
    const base64 = buffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64}`;

    const cloudName = this.settings.get('CLOUDINARY_CLOUD_NAME');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: dataUri,
          upload_preset: this.settings.get('CLOUDINARY_UPLOAD_PRESET'),
          api_key: this.settings.get('CLOUDINARY_API_KEY'),
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Error al subir logo a Cloudinary');
    }

    const uploadData = await response.json();
    await this.storeRepo.upsert({ id: 'main', logo: uploadData.secure_url }, ['id']);
    return this.get();
  }
}
