import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly settings: SettingsService) {}

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.settings.get('OPENROUTER_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-embedding-001',
        input: text,
        dimensions: 768,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      this.logger.error(`Embedding error: ${JSON.stringify(error)}`);
      throw new Error(`Error al generar embedding: ${error?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  buildProductText(product: {
    title: string;
    description?: string;
    category: string;
    style: string;
  }): string {
    const parts = [
      product.title,
      product.description || '',
      `categoría: ${product.category}`,
      `estilo: ${product.style}`,
    ];
    return parts.filter(Boolean).join('. ');
  }
}
