import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type MockupType = 'vertical' | 'horizontal' | 'cuadrado';
export type MockupQuality = 'baja' | 'media' | 'alta';

@Entity('mockups')
export class Mockup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'varchar' })
  type: MockupType;

  @Column({ type: 'varchar', default: 'baja' })
  quality: MockupQuality;

  @Column()
  mockupUuid: string;

  @Column()
  smartObjectUuid: string;

  @Column({ nullable: true })
  previewUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
