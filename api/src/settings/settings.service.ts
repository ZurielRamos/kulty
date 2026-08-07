import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './settings.entity';

@Injectable()
export class SettingsService {
  private cache: Record<string, string> = {};

  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  async onModuleInit() {
    await this.loadCache();
  }

  private async loadCache() {
    const settings = await this.settingRepo.find();
    this.cache = settings.reduce(
      (acc, s) => ({ ...acc, [s.key]: s.value }),
      {} as Record<string, string>,
    );
  }

  async getAll(): Promise<Record<string, string>> {
    return { ...this.cache };
  }

  get(key: string): string {
    return this.cache[key] || process.env[key] || '';
  }

  async set(key: string, value: string): Promise<void> {
    await this.settingRepo.upsert({ key, value }, ['key']);
    this.cache[key] = value;
  }

  async setMany(settings: Record<string, string>): Promise<void> {
    const entities = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
    }));
    await this.settingRepo.upsert(entities, ['key']);
    await this.loadCache();
  }
}
