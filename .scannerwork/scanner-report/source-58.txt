import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';

import { UploadService } from './upload.service';
import { FichierExcel } from './entities/fichier-excel.entity';
import { DonneeProduction } from './entities/donnee-production.entity';
import { PosteCharge } from './entities/poste-charge.entity';
import { LogsService } from '../logs/logs.service';

jest.mock('xlsx');

function makeInsertQb(executeFn = jest.fn().mockResolvedValue(undefined)) {
  return {
    insert: jest.fn().mockReturnThis(),
    into:   jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    execute: executeFn,
  };
}

describe('UploadService', () => {
  let service: UploadService;
  let fichierRepo: any;
  let productionRepo: any;
  let chargeRepo: any;
  let logsService: any;

  const user = { id: 1 };

  beforeEach(async () => {
    fichierRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    productionRepo = { createQueryBuilder: jest.fn() };
    chargeRepo     = { createQueryBuilder: jest.fn() };
    logsService    = { createLog: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: getRepositoryToken(FichierExcel),     useValue: fichierRepo },
        { provide: getRepositoryToken(DonneeProduction), useValue: productionRepo },
        { provide: getRepositoryToken(PosteCharge),      useValue: chargeRepo },
        { provide: LogsService,                          useValue: logsService },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    jest.clearAllMocks();
  });

  it('throws BadRequestException when mimetype is not allowed', async () => {
    await expect(
      service.processExcel(
        { buffer: Buffer.from('x'), mimetype: 'text/plain', originalname: 'a.xls' } as any,
        'PRODUCTION', 'Janvier', 2024, user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when month is invalid', async () => {
    await expect(
      service.processExcel(
        { buffer: Buffer.from('x'), mimetype: 'application/vnd.ms-excel', originalname: 'a.xls' } as any,
        'PRODUCTION', 'BadMonth', 2024, user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when sheet is missing', async () => {
    (XLSX.read as jest.Mock).mockReturnValue({ SheetNames: ['Autre'], Sheets: {} });
    await expect(
      service.processExcel(
        { buffer: Buffer.from('x'), mimetype: 'application/vnd.ms-excel', originalname: 'a.xls' } as any,
        'PRODUCTION', 'Janvier', 2024, user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when rows are empty', async () => {
    (XLSX.read as jest.Mock).mockReturnValue({ SheetNames: ['Janvier'], Sheets: { Janvier: {} } });
    (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([]);
    await expect(
      service.processExcel(
        { buffer: Buffer.from('x'), mimetype: 'application/vnd.ms-excel', originalname: 'a.xls' } as any,
        'PRODUCTION', 'Janvier', 2024, user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when duplicate file exists', async () => {
    (XLSX.read as jest.Mock).mockReturnValue({ SheetNames: ['Janvier'], Sheets: { Janvier: {} } });
    (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([{ Date: '2024-01-01', Activité: 'A' }]);
    fichierRepo.findOne.mockResolvedValue({ id: 99 });
    await expect(
      service.processExcel(
        { buffer: Buffer.from('x'), mimetype: 'application/vnd.ms-excel', originalname: 'a.xls' } as any,
        'PRODUCTION', 'Janvier', 2024, user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('imports PRODUCTION successfully', async () => {
    (XLSX.read as jest.Mock).mockReturnValue({ SheetNames: ['Janvier'], Sheets: { Janvier: {} } });
    (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
      { Date: '2024-01-01', 'Activité': 'Terrassement', Zone: 'Z1',
        'Prévu/Jour (T)': 10, 'Réalisé/Jour (T)': 12, 'Taux R/P (%)': 120,
        'Cumul Prévu (T)': 100, 'Cumul Réalisé (T)': 120 },
    ]);
    fichierRepo.findOne.mockResolvedValue(null);

    const fichierQb = {
      insert: jest.fn().mockReturnThis(),
      into:   jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      execute: jest.fn()
        .mockResolvedValueOnce({ identifiers: [{ id: 55 }] })
        .mockResolvedValueOnce(undefined),
      update: jest.fn().mockReturnThis(),
      set:    jest.fn().mockReturnThis(),
      where:  jest.fn().mockReturnThis(),
    };
    fichierRepo.createQueryBuilder.mockReturnValue(fichierQb);
    productionRepo.createQueryBuilder.mockReturnValue(makeInsertQb());
    logsService.createLog.mockResolvedValue(undefined);

    const res = await service.processExcel(
      { buffer: Buffer.from('x'), mimetype: 'application/vnd.ms-excel', originalname: 'prod.xls' } as any,
      'PRODUCTION', 'Janvier', 2024, user,
    );

    expect(res.fichierId).toBe(55);
    expect(res.lignesSauvegardees).toBe(1);
  });

  it('imports CHARGES successfully', async () => {
    (XLSX.read as jest.Mock).mockReturnValue({ SheetNames: ['Janvier'], Sheets: { Janvier: {} } });
    (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
      { Date: '2024-01-01', 'Poste de charge': 'Energie', 'Catégorie': 'UTIL',
        'Prévu/Jour (DH)': 100, 'Réalisé/Jour (DH)': 110, 'Écart/Jour (DH)': 10,
        'Taux R/P (%)': 110, 'Cumul Prévu (DH)': 1000, 'Cumul Réalisé (DH)': 1100 },
    ]);
    fichierRepo.findOne.mockResolvedValue(null);

    const fichierQb = {
      insert: jest.fn().mockReturnThis(),
      into:   jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      execute: jest.fn()
        .mockResolvedValueOnce({ identifiers: [{ id: 12 }] })
        .mockResolvedValueOnce(undefined),
      update: jest.fn().mockReturnThis(),
      set:    jest.fn().mockReturnThis(),
      where:  jest.fn().mockReturnThis(),
    };
    fichierRepo.createQueryBuilder.mockReturnValue(fichierQb);
    chargeRepo.createQueryBuilder.mockReturnValue(makeInsertQb());
    logsService.createLog.mockResolvedValue(undefined);

    const res = await service.processExcel(
      { buffer: Buffer.from('x'), mimetype: 'application/vnd.ms-excel', originalname: 'charges.xls' } as any,
      'CHARGES', 'Janvier', 2024, user,
    );

    expect(res.fichierId).toBe(12);
    expect(res.lignesSauvegardees).toBe(1);
  });
});