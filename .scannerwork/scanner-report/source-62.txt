import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

import { FichierExcel } from '../upload/entities/fichier-excel.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  CONTROLEUR = 'CONTROLEUR',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullname!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CONTROLEUR,
  })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;

  // 🔥 RELATION : 1 user → plusieurs fichiers uploadés
  @OneToMany(() => FichierExcel, (file) => file.user)
  uploads!: FichierExcel[];
}
