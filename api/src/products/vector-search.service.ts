import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class VectorSearchService implements OnModuleInit {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    // Habilitar extensión pgvector
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
    this.logger.log('pgvector extension enabled');

    // Agregar columna vector si no existe
    await this.dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'embedding_vector'
        ) THEN
          ALTER TABLE products ADD COLUMN embedding_vector vector(768);
        END IF;
      END $$;
    `);

    this.logger.log('embedding_vector column ready');
  }

  /**
   * Inserta o actualiza el embedding de un producto
   */
  async upsertEmbedding(productId: number, embedding: number[]) {
    const vectorStr = `[${embedding.join(',')}]`;
    await this.dataSource.query(
      'UPDATE products SET embedding_vector = $1::vector WHERE id = $2',
      [vectorStr, productId],
    );
  }

  /**
   * Elimina el embedding de un producto
   */
  async deleteEmbedding(productId: number) {
    await this.dataSource.query(
      'UPDATE products SET embedding_vector = NULL WHERE id = $1',
      [productId],
    );
  }

  /**
   * Busca los productos más similares usando distancia coseno
   */
  async searchSimilar(queryEmbedding: number[], limit = 10): Promise<number[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    const rows = await this.dataSource.query(
      `SELECT id FROM products
       WHERE embedding_vector IS NOT NULL AND is_active = true
       ORDER BY embedding_vector <=> $1::vector
       LIMIT $2`,
      [vectorStr, limit],
    );
    return rows.map((row: { id: number }) => row.id);
  }
}
