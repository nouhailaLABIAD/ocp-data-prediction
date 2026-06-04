import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logsService: LogsService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  // auth.service.ts
async login(email: string, password: string) {
  const user = await this.validateUser(email, password);

  await this.logsService.createLog(
    user,
    'CONNEXION',
    'AuthModule',
    `email=${user.email}`,
  );

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    access_token: this.jwtService.sign(payload),
    user: {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    },
  };
}

// 🔴 AJOUT LOGOUT
async logout(user: any) {
  await this.logsService.createLog(
    user,
    'DECONNEXION',
    'AuthModule',
    `email=${user.email}`,
  );

  return { message: 'logout success' };
}

}

