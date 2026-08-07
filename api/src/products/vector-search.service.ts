import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Usa una tabla separada 'product_embeddings' que TypeORM no conoce
 * y por lo tanto synchronize no la toca nunca.
 */
@Injectable()
export class VectorSearchService implements OnModuleInit {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Tabla separada que TypeORM no gestiona = nunca se borra
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS product_embeddings (
        product_id INTEGER PRIMARY KEY,
        embedding vector(768) NOT NULL
      )
    `);

    this.logger.log('product_embeddings table ready');
  }

  async upsertEmbedding(productId: number, embedding: number[]) {
    const vectorStr = `[${embedding.join(',')}]`;
    await this.dataSource.query(
      `INSERT INTO product_embeddings (product_id, embedding)
       VALUES ($1, $2::vector)
       ON CONFLICT (product_id) DO UPDATE SET embedding = $2::vector`,
      [productId, vectorStr],
    );
  }

  async deleteEmbedding(productId: number) {
    await this.dataSource.query(
      'DELETE FROM product_embeddings WHERE product_id = $1',
      [productId],
    );
  }

  async searchSimilar(queryEmbedding: number[], limit = 10): Promise<number[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    const rows = await this.dataSource.query(
      `SELECT product_id FROM product_embeddings
       WHERE product_id IN (SELECT id FROM products WHERE "isActive" = true)
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorStr, limit],
    );
    return rows.map((row: { product_id: number }) => row.product_id);
  }
}
