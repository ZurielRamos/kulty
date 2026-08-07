import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mockup, MockupType } from './mockups.entity';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class MockupsService {
  constructor(
    @InjectRepository(Mockup)
    private readonly mockupRepo: Repository<Mockup>,
    private readonly settings: SettingsService,
  ) {}

  findAll(): Promise<Mockup[]> {
    return this.mockupRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  findByType(type: MockupType): Promise<Mockup[]> {
    return this.mockupRepo.find({
      where: { type, isActive: true },
    });
  }

  async create(data: {
    title: string;
    type: MockupType;
    mockupUuid: string;
    smartObjectUuid: string;
    previewUrl?: string;
  }): Promise<Mockup> {
    const mockup = this.mockupRepo.create(data);
    return this.mockupRepo.save(mockup);
  }

  async remove(id: number): Promise<void> {
    await this.mockupRepo.update(id, { isActive: false });
  }

  async update(id: number, data: Partial<{
    title: string;
    type: MockupType;
    mockupUuid: string;
    smartObjectUuid: string;
    previewUrl: string;
  }>): Promise<Mockup> {
    await this.mockupRepo.update(id, data);
    return this.mockupRepo.findOneBy({ id }) as Promise<Mockup>;
  }

  async uploadPreview(id: number, buffer: Buffer): Promise<Mockup> {
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
      throw new Error('Error al subir preview a Cloudinary');
    }

    const data = await response.json();
    await this.mockupRepo.update(id, { previewUrl: data.secure_url });
    return this.mockupRepo.findOneBy({ id }) as Promise<Mockup>;
  }
}
