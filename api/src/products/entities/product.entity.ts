import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../enums/category.enum';
import { Style } from '../enums/style.enum';

export type Orientation = 'vertical' | 'horizontal';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar' })
  category: Category;

  @Column({ type: 'varchar' })
  style: Style;

  @Column({ type: 'varchar' })
  orientation: Orientation;

  // Galería de imágenes (varias URLs)
  @Column('jsonb')
  gallery: string[];

  @Column({ default: true })
  isActive: boolean;

  // Texto combinado para embedding
  @Column({ nullable: true })
  embeddingText: string;

  // Vector embedding (768 dimensiones) - pgvector
  @Column({ type: 'varchar', nullable: true, select: false })
  embedding_vector: string;

  // Mockup: plan de sudomock al momento de crear
  @Column({ type: 'varchar', nullable: true })
  mockup: string;

  // ID del mockup utilizado (de la tabla mockups)
  @Column({ nullable: true })
  mockupId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
