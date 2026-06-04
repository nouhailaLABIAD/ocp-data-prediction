import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from './user.entity';
import { LogsService } from '../logs/logs.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private logsService: LogsService,
  ) {}

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll() {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  // ✅ currentUser = l'admin qui effectue l'action (passé depuis le controller)
  async createUser(createUserDto: CreateUserDto, currentUser: any) {
    const userExists = await this.findByEmail(createUserDto.email);
    if (userExists) {
      throw new BadRequestException('Email deja utilise');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const saved = await this.usersRepository.save(user);

    try {
      // ✅ Log avec currentUser (l'admin), pas avec "saved" (la cible)
      await this.logsService.createLog(
        currentUser,
        'AJOUT_UTILISATEUR',
        'UsersModule',
        `email=${saved.email}, role=${saved.role}`,
      );
    } catch (e) {
      // Ne casse pas la création
    }

    return saved;
  }

  // ✅ currentUser = l'admin qui effectue la suppression
  async deleteUser(id: number, currentUser: any) {
    const toDelete = await this.usersRepository.findOne({ where: { id } });
    const res = await this.usersRepository.delete(id);

    try {
      if (toDelete) {
        // ✅ Log avec currentUser (l'admin), pas avec "toDelete" (la cible)
        await this.logsService.createLog(
          currentUser,
          'SUPPRESSION_UTILISATEUR',
          'UsersModule',
          `email=${toDelete.email}`,
        );
      }
    } catch (e) {
      // Ne casse pas la suppression
    }

    return res;
  }

  async createAdmin() {
    const adminExists = await this.findByEmail('admin@ocp.ma');
    if (adminExists) return;

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = this.usersRepository.create({
      fullname: 'Admin OCP',
      email: 'admin@ocp.ma',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    await this.usersRepository.save(admin);
  }

  // ✅ currentUser = l'admin qui effectue la modification
  async updateUser(id: number, updateUserDto: UpdateUserDto, currentUser: any) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    if (updateUserDto.fullname) user.fullname = updateUserDto.fullname;
    if (updateUserDto.email)    user.email    = updateUserDto.email;
    if (updateUserDto.role)     user.role     = updateUserDto.role;

    if (updateUserDto.password && updateUserDto.password.trim() !== '') {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const saved = await this.usersRepository.save(user);

    try {
      // ✅ Log avec currentUser (l'admin), pas avec "saved" (la cible)
      await this.logsService.createLog(
        currentUser,
        'MODIFICATION_UTILISATEUR',
        'UsersModule',
        `cible=${saved.email}, role=${saved.role}`,
      );
    } catch (e) {
      // Ne casse pas la modification
    }

    return saved;
  }
}