// fichier-excel.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, OneToMany,
} from 'typeorm';
import { User }             from '../../users/user.entity';
import { DonneeProduction } from './donnee-production.entity';
import { PosteCharge }      from './poste-charge.entity';

@Entity()
export class FichierExcel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nomFichier!: string;

  @Column({ type: 'enum', enum: ['PRODUCTION', 'CHARGES', 'RECAP'] })
  type!: string;

  @Column()
  mois!: string;   // "Janvier", "Février"...

  @Column()
  annee!: number;  // 2025

  @Column({ default: 'TRAITE' })
  statut!: string;

  @Column({ default: 0 })
  nbLignes!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, user => user.uploads, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => DonneeProduction, dp => dp.fichier, { cascade: true })
  productions!: DonneeProduction[];

  @OneToMany(() => PosteCharge, pc => pc.fichier, { cascade: true })
  charges!: PosteCharge[];
}