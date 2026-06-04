import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';


import { AuthService } from './auth.service';

import { UsersService } from '../users/users.service';
import { LogsService } from '../logs/logs.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let logsService: jest.Mocked<LogsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { findByEmail: jest.fn(), createUser: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: LogsService, useValue: { createLog: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as any;
    jwtService = module.get(JwtService) as any;
    logsService = module.get(LogsService) as any;

    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();

    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('returns user when email exists and password matches', async () => {
      const user = { id: 1, email: 'a@b.com', password: 'hashed', fullname: 'A', role: 'ADMIN' };
      usersService.findByEmail.mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.validateUser('a@b.com', 'secret')).resolves.toEqual(user);
      expect(usersService.findByEmail).toHaveBeenCalledWith('a@b.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('secret', 'hashed');
    });

    it('throws UnauthorizedException when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser('missing@b.com', 'secret')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password does not match', async () => {
      const user = { id: 1, email: 'a@b.com', password: 'hashed' };
      usersService.findByEmail.mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('a@b.com', 'wrong')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('propagates bcrypt.compare error', async () => {
      const user = { id: 1, email: 'a@b.com', password: 'hashed' };
      usersService.findByEmail.mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('bcrypt failed'));

      await expect(service.validateUser('a@b.com', 'secret')).rejects.toThrow('bcrypt failed');
    });

    it('propagates UsersService.findByEmail error', async () => {
      usersService.findByEmail.mockRejectedValue(new Error('db failed'));

      await expect(service.validateUser('a@b.com', 'secret')).rejects.toThrow('db failed');
    });
  });

  describe('login', () => {
    it('logs connexion and returns token payload when credentials are valid', async () => {
      const user = { id: 7, email: 'admin@ocp.ma', password: 'hashed', fullname: 'Admin', role: 'ADMIN' };
      usersService.findByEmail.mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');
      logsService.createLog.mockResolvedValue(undefined);

      const res = await service.login('admin@ocp.ma', 'admin123');

      expect(logsService.createLog).toHaveBeenCalledWith(
        user,
        'CONNEXION',
        'AuthModule',
        `email=${user.email}`,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      expect(res).toEqual({
        access_token: 'jwt-token',
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
        },
      });
    });

    it('propagates validateUser UnauthorizedException on invalid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.login('x', 'y')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(logsService.createLog).not.toHaveBeenCalled();
    });

    it('propagates jwtService.sign error', async () => {
      const user = { id: 1, email: 'a@b.com', password: 'hashed', fullname: 'A', role: 'ADMIN' };
      usersService.findByEmail.mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockImplementation(() => {
        throw new Error('sign failed');
      });

      await expect(service.login('a@b.com', 'secret')).rejects.toThrow('sign failed');
    });

    it('still returns token if logsService.createLog throws', async () => {
      const user = { id: 1, email: 'a@b.com', password: 'hashed', fullname: 'A', role: 'USER' };
      usersService.findByEmail.mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      // AuthService.login does NOT catch logsService.createLog error
      logsService.createLog.mockRejectedValue(new Error('log failed'));

      await expect(service.login('a@b.com', 'secret')).rejects.toThrow('log failed');
    });
  });

  describe('logout', () => {
    it('creates deconnexion log and returns success message', async () => {
      logsService.createLog.mockResolvedValue(undefined);
      const user = { id: 3, email: 'u@x.com' };
      await expect(service.logout(user)).resolves.toEqual({ message: 'logout success' });
      expect(logsService.createLog).toHaveBeenCalledWith(user, 'DECONNEXION', 'AuthModule', `email=${user.email}`);
    });

    it('propagates logsService.createLog error', async () => {
      const user = { id: 3, email: 'u@x.com' };
      logsService.createLog.mockRejectedValue(new Error('log failed'));
      await expect(service.logout(user)).rejects.toThrow('log failed');
    });

    it('works with user.userId shape', async () => {
      logsService.createLog.mockResolvedValue(undefined);
      const user = { userId: 5, email: 'u@x.com' };
      await expect(service.logout(user)).resolves.toEqual({ message: 'logout success' });
    });
  });
});

