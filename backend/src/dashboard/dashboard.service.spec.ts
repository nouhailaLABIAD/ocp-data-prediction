import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { DashboardService } from './dashboard.service';
import { PosteCharge } from '../upload/entities/poste-charge.entity';
import { DonneeProduction } from '../upload/entities/donnee-production.entity';



describe('DashboardService', () => {
  let service: DashboardService;
  let chargeRepo: any;
  let productionRepo: any;

  beforeEach(async () => {
    chargeRepo = { find: jest.fn() };
    productionRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(PosteCharge), useValue: chargeRepo },
        { provide: getRepositoryToken(DonneeProduction), useValue: productionRepo },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getCharges', () => {
    it('maps charges rows into frontend format and computes total', async () => {
      chargeRepo.find.mockResolvedValue([
        {
          mois: 'Janvier',
          poste: 'Energie',
          categorie: 'UTIL',
          realiseJour: 100,
          prevuJour: 80,
          ecartJour: 20,
          cumulRealise: 1000,
          cumulPrevu: 800,
          fichier: { id: 1 },
        },
        {
          mois: 'Janvier',
          poste: 'Maintenance',
          categorie: null,
          realiseJour: null,
          prevuJour: undefined,
          ecartJour: null,
          fichier: { id: 1 },
        },
      ]);

      const res = await service.getCharges({ id: 1 });
      expect(chargeRepo.find).toHaveBeenCalledWith({ relations: ['fichier'] });
      expect(res.total).toBe(2);
      expect(res.data[0]).toMatchObject({
        mois: 'Janvier',
        poste: 'Energie',
        categorie: 'UTIL',
        cout_realise: 100,
        cout_prevu: 80,
        ecart: 20,
        cumul_realise: 1000,
        cumul_prevu: 800,
        site: null,
        stade: null,
      });
      expect(res.data[1]).toMatchObject({
        categorie: '',
        cout_realise: 0,
        cout_prevu: 0,
        ecart: 0,
      });
    });

    it('propagates repository errors', async () => {
      chargeRepo.find.mockRejectedValue(new Error('db failed'));
      await expect(service.getCharges({ id: 1 })).rejects.toThrow('db failed');
    });

    it('returns empty list when repo returns empty', async () => {
      chargeRepo.find.mockResolvedValue([]);
      const res = await service.getCharges({ id: 1 });
      expect(res).toEqual({ data: [], total: 0 });
    });

    it('sets default values when numeric fields are missing', async () => {
      chargeRepo.find.mockResolvedValue([
        { mois: 'Février', poste: 'Energie', fichier: { id: 1 } },
      ]);
      const res = await service.getCharges({ id: 1 });
      expect(res.data[0]).toMatchObject({ cout_realise: 0, cout_prevu: 0, ecart: 0 });
    });
  });

  describe('getProduction', () => {
    it('maps production rows into frontend format and computes ecart correctly', async () => {
      productionRepo.find.mockResolvedValue([
        {
          mois: 'Janvier',
          activite: 'Creusement',
          zone: 'Zone1',
          realiseT: 200,
          prevuT: 150,
          tauxRP: 20,
          cumulRealiseT: 2000,
          cumulPrevuT: 1500,
          fichier: { id: 1 },
        },
      ]);

      const res = await service.getProduction({ id: 1 });
      expect(productionRepo.find).toHaveBeenCalledWith({ relations: ['fichier'] });
      expect(res.total).toBe(1);
      expect(res.data[0]).toMatchObject({
        mois: 'Janvier',
        activite: 'Creusement',
        zone: 'Zone1',
        tonnage_realise: 200,
        tonnage_prevu: 150,
        ecart: 50,
        taux_rp: 20,
        cumul_realise: 2000,
        cumul_prevu: 1500,
        site: 'Zone1',
        qualite: null,
        nbre_voyages: null,
        cycle_moyen: null,
      });
    });

    it('sets default numeric values and computes ecart when prevuT/realiseT are missing', async () => {
      productionRepo.find.mockResolvedValue([
        { mois: 'Janvier', activite: null, zone: null, fichier: { id: 1 } },
      ]);
      const res = await service.getProduction({ id: 1 });
      expect(res.data[0]).toMatchObject({
        activite: '',
        zone: '',
        tonnage_realise: 0,
        tonnage_prevu: 0,
        ecart: 0,
      });
    });

    it('propagates repository errors', async () => {
      productionRepo.find.mockRejectedValue(new Error('db failed'));
      await expect(service.getProduction({ id: 1 })).rejects.toThrow('db failed');
    });

    it('returns empty list when repo returns empty', async () => {
      productionRepo.find.mockResolvedValue([]);
      const res = await service.getProduction({ id: 1 });
      expect(res).toEqual({ data: [], total: 0 });
    });
  });
});

