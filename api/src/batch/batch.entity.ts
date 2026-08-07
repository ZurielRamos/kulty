import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  total: number;

  @Column({ default: 0 })
  processed: number;

  @Column({ default: 0 })
  failed: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: BatchStatus;

  @Column({ nullable: true })
  currentFile: string;

  @Column({ type: 'jsonb', default: '[]' })
  errors: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
