import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('store_config')
export class StoreConfig {
  @PrimaryColumn({ default: 'main' })
  id: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  facebook: string;

  @Column({ nullable: true })
  tiktok: string;

  @Column({ type: 'jsonb', nullable: true })
  prices: { size: string; price: number }[];
}
