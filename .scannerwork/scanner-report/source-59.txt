// upload.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';

import { FichierExcel } from './entities/fichier-excel.entity';
import { DonneeProduction } from './entities/donnee-production.entity';
import { PosteCharge } from './entities/poste-charge.entity';
import { LogsService } from '../logs/logs.service';

// ===============================
// Mapping mois -> feuille Excel
// ===============================
const MOIS_SHEET_MAP: Record<string, string> = {
  Janvier: 'Janvier',
  Février: 'Février',
  Mars: 'Mars',
  Avril: 'Avril',
  Mai: 'Mai',
  Juin: 'Juin',
  Juillet: 'Juillet',
  Août: 'Août',
  Septembre: 'Septembre',
  Octobre: 'Octobre',
  Novembre: 'Novembre',
  Décembre: 'Décembre',
};

// ===============================================================
// Structure réelle des fichiers Excel OCP :
//
//  PRODUCTION :
//    Ligne 1 → titre fusionné  "PRODUCTION JOURNALIÈRE — ..."
//    Ligne 2 → vide
//    Ligne 3 → EN-TÊTES  (index 0-based = 2)  ← range: 2
//    Ligne 4+ → données
//
//  CHARGES :
//    Ligne 1 → titre fusionné  "CHARGES JOURNALIÈRES — ..."
//    Ligne 2 → sous-titre
//    Ligne 3 → vide
//    Ligne 4 → EN-TÊTES  (index 0-based = 3)  ← range: 3
//    Ligne 5+ → données
// ===============================================================

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(FichierExcel)
    private fichierRepo: Repository<FichierExcel>,

    @InjectRepository(DonneeProduction)
    private productionRepo: Repository<DonneeProduction>,

    @InjectRepository(PosteCharge)
    private chargeRepo: Repository<PosteCharge>,
    private logsService: LogsService,
  ) {}

  // =====================================================
  // PROCESS EXCEL
  // =====================================================

  async processExcel(
    file: Express.Multer.File,
    type: string,
    mois: string,
    annee: number,
    user: any,
  ) {
    // ─── Vérification type MIME ───────────────────────
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Fichier Excel uniquement (.xlsx)');
    }

    // ─── Lecture workbook ─────────────────────────────
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });

    // ─── Vérification feuille ─────────────────────────
    const sheetName = MOIS_SHEET_MAP[mois];
    if (!sheetName) {
      throw new BadRequestException(`Mois invalide : ${mois}`);
    }
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new BadRequestException(
        `Feuille "${sheetName}" introuvable.\n` +
          `Feuilles disponibles : ${workbook.SheetNames.join(', ')}`,
      );
    }

    const sheet = workbook.Sheets[sheetName];

    // ─── Lecture selon type (skip lignes de titre) ────
    //   PRODUCTION : en-têtes en ligne 3  → range: 2  (0-based)
    //   CHARGES    : en-têtes en ligne 4  → range: 3  (0-based)
    //   RECAP      : on essaie range 0 par défaut
    let rows: any[];

    if (type === 'PRODUCTION') {
      rows = XLSX.utils.sheet_to_json(sheet, { range: 2 });
    } else if (type === 'CHARGES') {
      rows = XLSX.utils.sheet_to_json(sheet, { range: 3 });
    } else {
      rows = XLSX.utils.sheet_to_json(sheet);
    }

    if (rows.length === 0) {
      throw new BadRequestException(
        `La feuille "${sheetName}" est vide ou les en-têtes sont introuvables`,
      );
    }

    // ─── Vérification doublon ─────────────────────────
    const existingFile = await this.fichierRepo.findOne({
      where: { type, mois, annee, user: { id: user.id } },
      relations: ['user'],
    });
    if (existingFile) {
      throw new BadRequestException(
        `Un fichier ${type} pour ${mois} ${annee} existe déjà.`,
      );
    }

    // ─── Insertion FichierExcel via QueryBuilder ──────
    //   (évite tout UPDATE parasite de TypeORM .save())
    const insertResult = await this.fichierRepo
      .createQueryBuilder()
      .insert()
      .into(FichierExcel)
      .values({
        nomFichier: file.originalname,
        type,
        mois,
        annee,
        statut: 'TRAITE',
        nbLignes: 0,
        user: { id: user.id }, // FIX userId null
      })
      .execute();

    const fichierId: number = insertResult.identifiers[0].id;
    if (!fichierId) {
      throw new Error('Échec de la sauvegarde du fichier');
    }

    // ─── Parsing selon type ───────────────────────────
    let lignesSauvegardees = 0;

    if (type === 'PRODUCTION') {
      lignesSauvegardees = await this.parseProduction(rows, fichierId, mois);
    } else if (type === 'CHARGES') {
      lignesSauvegardees = await this.parseCharges(rows, fichierId, mois);
    } else {
      lignesSauvegardees = rows.length;
    }

    // ─── Mise à jour nbLignes via QueryBuilder ────────
    //   (FIX UpdateValuesMissingError)
    await this.fichierRepo
      .createQueryBuilder()
      .update(FichierExcel)
      .set({ nbLignes: lignesSauvegardees })
      .where('id = :id', { id: fichierId })
      .execute();

    // ─── Journalisation ─────────────────────────────────
    try {
      await this.logsService.createLog(
        user,
        'UPLOAD_FICHIER',
        'UploadModule',
        `type=${type}, mois=${mois}, annee=${annee}, lignesLues=${rows.length}, lignesSauvegardees=${lignesSauvegardees}`,
      );
    } catch (e) {
      // Ne casse pas le traitement d'upload
    }

    // ─── Réponse ──────────────────────────────────────
    return {
      message: `Fichier ${type} importé avec succès`,
      fichierId,
      mois,
      annee,
      feuilleLue: sheetName,
      lignesLues: rows.length,
      lignesSauvegardees,
    };
  }

  // =====================================================
  // PARSE PRODUCTION
  // En-têtes réels (ligne 3 du fichier) :
  //   Date | Activité | Zone | Prévu/Jour (T) | Réalisé/Jour (T)
  //   | Taux R/P (%) | Cumul Prévu (T) | Cumul Réalisé (T)
  // =====================================================

  private async parseProduction(
    rows: any[],
    fichierId: number,
    mois: string,
  ): Promise<number> {
    const values: Partial<DonneeProduction>[] = [];

    for (const row of rows) {
      // Ignorer lignes sans date ni activité
      if (!row['Date'] || !row['Activité']) continue;

      values.push({
        date: String(row['Date']),
        mois,
        activite: String(row['Activité']),
        zone: String(row['Zone'] ?? ''),
        prevuT: Number(row['Prévu/Jour (T)']) || 0,
        realiseT: Number(row['Réalisé/Jour (T)']) || 0,
        tauxRP: Number(row['Taux R/P (%)']) || 0,
        cumulPrevuT: Number(row['Cumul Prévu (T)']) || 0,
        cumulRealiseT: Number(row['Cumul Réalisé (T)']) || 0,
        fichier: { id: fichierId } as FichierExcel,
      });
    }

    if (values.length === 0) return 0;

    // INSERT direct — sans .save() pour éviter UPDATE parasite
    await this.productionRepo
      .createQueryBuilder()
      .insert()
      .into(DonneeProduction)
      .values(values)
      .execute();

    return values.length;
  }

  // =====================================================
  // PARSE CHARGES
  // En-têtes réels (ligne 4 du fichier) :
  //   Date | Catégorie | Poste de charge | Prévu/Jour (DH)
  //   | Réalisé/Jour (DH) | Écart/Jour (DH) | Taux R/P (%)
  //   | Cumul Prévu (DH) | Cumul Réalisé (DH) | Écart Cumul (DH)
  // =====================================================

  private async parseCharges(
    rows: any[],
    fichierId: number,
    mois: string,
  ): Promise<number> {
    const values: Partial<PosteCharge>[] = [];

    for (const row of rows) {
      // Ignorer lignes sans date ni poste
      if (!row['Date'] || !row['Poste de charge']) continue;

      values.push({
        date: String(row['Date']),
        mois,
        categorie: String(row['Catégorie'] ?? ''),
        poste: String(row['Poste de charge']),
        prevuJour: Number(row['Prévu/Jour (DH)']) || 0,
        realiseJour: Number(row['Réalisé/Jour (DH)']) || 0,
        ecartJour: Number(row['Écart/Jour (DH)']) || 0,
        tauxRP: Number(row['Taux R/P (%)']) || 0,
        cumulPrevu: Number(row['Cumul Prévu (DH)']) || 0,
        cumulRealise: Number(row['Cumul Réalisé (DH)']) || 0,
        fichier: { id: fichierId } as FichierExcel,
      });
    }

    if (values.length === 0) return 0;

    // INSERT direct — sans .save() pour éviter UPDATE parasite
    await this.chargeRepo
      .createQueryBuilder()
      .insert()
      .into(PosteCharge)
      .values(values)
      .execute();

    return values.length;
  }
}
