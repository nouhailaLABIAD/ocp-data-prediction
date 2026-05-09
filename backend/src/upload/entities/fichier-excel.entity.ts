import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { User } from '../../users/user.entity';

@Entity()
export class FichierExcel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nomFichier!: string;

  @Column()
  chemin!: string;

  @Column({ nullable: true })
  taille!: number;

  @CreateDateColumn()
  createdAt!: Date;

  // 🔥 RELATION : plusieurs fichiers → 1 user
  @ManyToOne(() => User, (user) => user.uploads, {
    onDelete: 'CASCADE',
  })
  user!: User;
}