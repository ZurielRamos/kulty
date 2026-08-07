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

    // Crear columna vector si no existe (fuera de TypeORM para que no la toque)
    const col = await this.dataSource.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'embedding_vector'
    `);

    if (col.length === 0) {
      await this.dataSource.query(
        `ALTER TABLE products ADD COLUMN embedding_vector vector(768)`,
      );
      this.logger.log('embedding_vector column created');
    } else if (col[0].data_type === 'character varying') {
      // Si TypeORM la recreó como varchar, convertirla
      await this.dataSource.query(`ALTER TABLE products DROP COLUMN embedding_vector`);
      await this.dataSource.query(`ALTER TABLE products ADD COLUMN embedding_vector vector(768)`);
      this.logger.log('embedding_vector column recreated as vector(768)');
    }

    this.logger.log('vector search ready');
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
       WHERE embedding_vector IS NOT NULL AND "isActive" = true
       ORDER BY embedding_vector <=> $1::vector
       LIMIT $2`,
      [vectorStr, limit],
    );
    return rows.map((row: { id: number }) => row.id);
  }
}
