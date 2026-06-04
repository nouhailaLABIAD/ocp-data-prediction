import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { LogsService } from '../logs/logs.service';
import { User, UserRole } from './user.entity';




jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<ReturnType<typeof createRepoMock>>;
  let logsService: jest.Mocked<LogsService>;

  function createRepoMock() {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    };
  }

  beforeEach(async () => {
    repo = createRepoMock() as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: LogsService, useValue: { createLog: jest.fn() } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    logsService = module.get(LogsService) as any;

    (bcrypt.hash as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('returns user when exists', async () => {
      repo.findOne.mockResolvedValue({ id: 1, email: 'a@b.com' } as any);
      await expect(service.findByEmail('a@b.com')).resolves.toEqual({ id: 1, email: 'a@b.com' });
      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    });

    it('returns null when not exists', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findByEmail('missing@b.com')).resolves.toBeNull();
    });

    it('propagates repo error', async () => {
      repo.findOne.mockRejectedValue(new Error('db failed'));
      await expect(service.findByEmail('a@b.com')).rejects.toThrow('db failed');
    });
  });

  describe('findAll', () => {
    it('returns users ordered by createdAt desc', async () => {
      repo.find.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      await expect(service.findAll()).resolves.toEqual([{ id: 1 }, { id: 2 }]);
      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });

    it('propagates repo error', async () => {
      repo.find.mockRejectedValue(new Error('db failed'));
      await expect(service.findAll()).rejects.toThrow('db failed');
    });
  });

  describe('createUser', () => {
    it('throws BadRequestException when email already used', async () => {
      repo.findOne.mockResolvedValue({ id: 10, email: 'a@b.com' } as any);
      await expect(
        service.createUser({ email: 'a@b.com', password: 'x', fullname: 'A', role: UserRole.CONTROLEUR } as any, { id: 1 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.createUser({ email: 'a@b.com', password: 'x', fullname: 'A', role: UserRole.CONTROLEUR } as any, { id: 1 }),
      ).rejects.toThrow('Email deja utilise');
    });

    it('creates user, hashes password, saves and logs (normal path)', async () => {
      repo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pass');

      repo.create.mockImplementation((x) => x);
      repo.save.mockResolvedValue({
        id: 33,
        email: 'new@b.com',
        role: UserRole.USER,
        fullname: 'New',
        password: 'hashed-pass',
      } as any);
      logsService.createLog.mockResolvedValue(undefined);

      const saved = await service.createUser(
        { email: 'new@b.com', password: 'pw', fullname: 'New', role: UserRole.USER } as any,
        { id: 1, role: UserRole.ADMIN },
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('pw', 10);
      expect(repo.save).toHaveBeenCalled();
      expect(logsService.createLog).toHaveBeenCalledWith(
        { id: 1, role: UserRole.ADMIN },
        'AJOUT_UTILISATEUR',
        'UsersModule',
        expect.stringContaining('email=new@b.com'),
      );
      expect(saved.email).toBe('new@b.com');
    });

    it("does not fail creation when logsService.createLog throws", async () => {
      repo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pass');
      repo.create.mockImplementation((x) => x);
      repo.save.mockResolvedValue({ id: 33, email: 'new@b.com', role: UserRole.USER, fullname: 'New', password: 'hashed-pass' } as any);
      logsService.createLog.mockRejectedValue(new Error('log failed'));

      const saved = await service.createUser(
        { email: 'new@b.com', password: 'pw', fullname: 'New', role: UserRole.USER } as any,
        { id: 1 },
      );
      expect(saved.email).toBe('new@b.com');
    });

    it('propagates bcrypt.hash error', async () => {
      repo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('hash failed'));

      await expect(
        service.createUser({ email: 'a@b.com', password: 'pw', fullname: 'A', role: UserRole.USER } as any, { id: 1 }),
      ).rejects.toThrow('hash failed');
    });
  });

  describe('deleteUser', () => {
    it('deletes user and logs when target exists', async () => {
      repo.findOne.mockResolvedValue({ id: 2, email: 't@b.com' } as any);
      repo.delete.mockResolvedValue({ affected: 1 } as any);
      logsService.createLog.mockResolvedValue(undefined);

      const res = await service.deleteUser(2, { id: 1, role: UserRole.ADMIN });
      expect(repo.delete).toHaveBeenCalledWith(2);
      expect(logsService.createLog).toHaveBeenCalledWith(
        { id: 1, role: UserRole.ADMIN },
        'SUPPRESSION_UTILISATEUR',
        'UsersModule',
        `email=t@b.com`,
      );
      expect(res).toEqual({ affected: 1 });
    });

    it('does not log when target does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.delete.mockResolvedValue({ affected: 0 } as any);
      const res = await service.deleteUser(999, { id: 1 });
      expect(logsService.createLog).not.toHaveBeenCalled();
      expect(res).toEqual({ affected: 0 });
    });

    it('does not fail when logsService.createLog throws', async () => {
      repo.findOne.mockResolvedValue({ id: 2, email: 't@b.com' } as any);
      repo.delete.mockResolvedValue({ affected: 1 } as any);
      logsService.createLog.mockRejectedValue(new Error('log failed'));

      await expect(service.deleteUser(2, { id: 1 })).resolves.toEqual({ affected: 1 });
    });
  });

  describe('createAdmin', () => {
    it("does nothing when admin already exists", async () => {
      repo.findOne.mockResolvedValue({ id: 1, email: 'admin@ocp.ma' } as any);
      await service.createAdmin();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates admin when not exists', async () => {
      repo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      repo.create.mockImplementation((x) => x);
      repo.save.mockResolvedValue({ id: 1 } as any);
      await service.createAdmin();
      expect(bcrypt.hash).toHaveBeenCalledWith('admin123', 10);
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('throws BadRequestException when user not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.updateUser(123, { fullname: 'X' } as any, { id: 1 })).rejects.toThrow(
        'Utilisateur introuvable',
      );
    });

    it('updates fullname/email/role and logs', async () => {
      const existing = { id: 5, email: 'old@b.com', fullname: 'Old', role: UserRole.USER, password: 'pwd' } as any;
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, email: 'new@b.com', fullname: 'New', role: UserRole.ADMIN } as any);
      logsService.createLog.mockResolvedValue(undefined);

      const saved = await service.updateUser(
        5,
        { fullname: 'New', email: 'new@b.com', role: UserRole.ADMIN } as any,
        { id: 1, role: UserRole.ADMIN },
      );

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(saved.email).toBe('new@b.com');
      expect(logsService.createLog).toHaveBeenCalledWith(
        { id: 1, role: UserRole.ADMIN },
        'MODIFICATION_UTILISATEUR',
        'UsersModule',
        expect.stringContaining('cible=new@b.com'),
      );
    });

    it('hashes password when provided and not empty', async () => {
      const existing = { id: 5, email: 'old@b.com', fullname: 'Old', role: UserRole.USER, password: 'pwd' } as any;
      repo.findOne.mockResolvedValue(existing);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');
      repo.save.mockResolvedValue({ ...existing, password: 'new-hashed' } as any);

      await service.updateUser(5, { password: 'newpw' } as any, { id: 1 });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpw', 10);
    });

    it("does not fail when logsService.createLog throws", async () => {
      const existing = { id: 5, email: 'old@b.com', fullname: 'Old', role: UserRole.USER, password: 'pwd' } as any;
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, fullname: 'New' } as any);
      logsService.createLog.mockRejectedValue(new Error('log failed'));

      const saved = await service.updateUser(5, { fullname: 'New' } as any, { id: 1 });
      expect(saved.fullname).toBe('New');
    });

    it('propagates bcrypt.hash error when hashing password fails', async () => {
      const existing = { id: 5, email: 'old@b.com', fullname: 'Old', role: UserRole.USER, password: 'pwd' } as any;
      repo.findOne.mockResolvedValue(existing);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('hash failed'));

      await expect(service.updateUser(5, { password: 'pw' } as any, { id: 1 })).rejects.toThrow('hash failed');
    });
  });
});

