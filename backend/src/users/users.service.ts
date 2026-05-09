import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User, UserRole } from './user.entity';

import { CreateUserDto } from './dto/create-user.dto';

import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findAll() {
    return this.usersRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async createUser(createUserDto: CreateUserDto) {
    const userExists = await this.findByEmail(
      createUserDto.email,
    );

    if (userExists) {
      throw new BadRequestException(
        'Email deja utilise',
      );
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      10,
    );

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async deleteUser(id: number) {
    return this.usersRepository.delete(id);
  }

  async createAdmin() {
    const adminExists = await this.findByEmail(
      'admin@ocp.ma',
    );

    if (adminExists) {
      return;
    }

    const hashedPassword = await bcrypt.hash(
      'admin123',
      10,
    );

    const admin = this.usersRepository.create({
      fullname: 'Admin OCP',
      email: 'admin@ocp.ma',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    await this.usersRepository.save(admin);
  }
  async updateUser(id: number, updateUserDto: UpdateUserDto) {
  const user = await this.usersRepository.findOne({ where: { id } });

  if (!user) {
    throw new BadRequestException('Utilisateur introuvable');
  }

  if (updateUserDto.fullname) user.fullname = updateUserDto.fullname;
  if (updateUserDto.email)    user.email    = updateUserDto.email;
  if (updateUserDto.role)     user.role     = updateUserDto.role;

  // Mot de passe seulement si fourni
  if (updateUserDto.password && updateUserDto.password.trim() !== '') {
    user.password = await bcrypt.hash(updateUserDto.password, 10);
  }

  return this.usersRepository.save(user);
}
}