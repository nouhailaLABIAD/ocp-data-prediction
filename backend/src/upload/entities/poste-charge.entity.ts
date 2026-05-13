// poste-charge.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { FichierExcel } from './fichier-excel.entity';

@Entity()
export class PosteCharge {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  date!: string;

  @Column()
  mois!: string;

  @Column()
  categorie!: string;  // VARIABLE, FIXE

  @Column()
  poste!: string;      // Gasoil, Explosifs, PDR...

  @Column({ type: 'float', default: 0 })
  prevuJour!: number;

  @Column({ type: 'float', default: 0 })
  realiseJour!: number;

  @Column({ type: 'float', default: 0 })
  ecartJour!: number;

  @Column({ type: 'float', default: 0 })
  tauxRP!: number;

  @Column({ type: 'float', default: 0 })
  cumulPrevu!: number;

  @Column({ type: 'float', default: 0 })
  cumulRealise!: number;

  @ManyToOne(() => FichierExcel, f => f.charges, { onDelete: 'CASCADE' })
  fichier!: FichierExcel;
}