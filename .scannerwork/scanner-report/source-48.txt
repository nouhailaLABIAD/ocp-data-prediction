// dashboard.service.ts
// Ce service lit les données déjà en base (uploadées via UploadService)
// et les transforme au format attendu par Dashboard.jsx

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PosteCharge } from '../upload/entities/poste-charge.entity';
import { DonneeProduction } from '../upload/entities/donnee-production.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(PosteCharge)
    private chargeRepo: Repository<PosteCharge>,

    @InjectRepository(DonneeProduction)
    private productionRepo: Repository<DonneeProduction>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // GET /dashboard/charges
  // Retourne { data: [...] } compatible avec AnalyseChargesSection
  //
  // Format attendu par le frontend :
  //   { mois, poste, cout_realise, cout_prevu, ecart, site?, stade? }
  // ─────────────────────────────────────────────────────────────
  async getCharges(user: any) {
    // On charge TOUTES les lignes (pas de filtre user ici — ajuste si besoin)
    const rows = await this.chargeRepo.find({
      relations: ['fichier'],
    });

    const data = rows.map((r) => ({
      mois: r.mois,
      poste: r.poste,
      categorie: r.categorie ?? '',
      // Le frontend utilise cout_realise / cout_prevu / ecart
      cout_realise: r.realiseJour ?? 0,
      cout_prevu: r.prevuJour ?? 0,
      ecart: r.ecartJour ?? 0,
      // cumuls pour graphiques supplémentaires
      cumul_realise: r.cumulRealise ?? 0,
      cumul_prevu: r.cumulPrevu ?? 0,
      // champs optionnels (site/stade) — tu peux les enrichir depuis fichier si tu veux
      site: null,
      stade: null,
    }));

    return { data, total: data.length };
  }

  // ─────────────────────────────────────────────────────────────
  // GET /dashboard/production
  // Retourne { data: [...] } compatible avec AnalyseProductionSection
  //
  // Format attendu par le frontend :
  //   { mois, activite, zone, tonnage_realise, tonnage_prevu, ecart, site?, qualite? }
  // ─────────────────────────────────────────────────────────────
  async getProduction(user: any) {
    const rows = await this.productionRepo.find({
      relations: ['fichier'],
    });

    const data = rows.map((r) => ({
      mois: r.mois,
      activite: r.activite ?? '',
      zone: r.zone ?? '',
      // Le frontend utilise tonnage_realise / tonnage_prevu / ecart
      tonnage_realise: r.realiseT ?? 0,
      tonnage_prevu: r.prevuT ?? 0,
      ecart: (r.realiseT ?? 0) - (r.prevuT ?? 0),
      taux_rp: r.tauxRP ?? 0,
      cumul_realise: r.cumulRealiseT ?? 0,
      cumul_prevu: r.cumulPrevuT ?? 0,
      // champs optionnels — site et qualite non présents dans l'entité,
      // on dérive site depuis zone, qualite reste null
      site: r.zone ?? null,
      qualite: null,
      nbre_voyages: null,
      cycle_moyen: null,
    }));

    return { data, total: data.length };
  }
}