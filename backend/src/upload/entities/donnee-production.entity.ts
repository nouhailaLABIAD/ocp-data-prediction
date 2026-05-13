// donnee-production.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { FichierExcel } from './fichier-excel.entity';

@Entity()
export class DonneeProduction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  date!: string;

  @Column()
  mois!: string;

  @Column()
  activite!: string;  // EXTRACTION, CRIBLAGE, MANUTENTION, STOCKAGE

  @Column()
  zone!: string;      // BOUCHANE, MZINDA, YOUSSOUFIA

  @Column({ type: 'float', default: 0 })
  prevuT!: number;

  @Column({ type: 'float', default: 0 })
  realiseT!: number;

  @Column({ type: 'float', default: 0 })
  tauxRP!: number;

  @Column({ type: 'float', default: 0 })
  cumulPrevuT!: number;

  @Column({ type: 'float', default: 0 })
  cumulRealiseT!: number;

  @ManyToOne(() => FichierExcel, f => f.productions, { onDelete: 'CASCADE' })
  fichier!: FichierExcel;
}