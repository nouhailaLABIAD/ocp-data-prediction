import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import * as XLSX from 'xlsx';
import { Multer } from 'multer';

@Injectable()
export class UploadService {

  async processExcel(file: Express.Multer.File) {

    // Vérification type fichier
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Fichier Excel uniquement',
      );
    }

    // Lecture Excel
    const workbook = XLSX.read(file.buffer, {
      type: 'buffer',
    });

    // Première feuille
    const sheetName = workbook.SheetNames[0];

    const sheet =
      workbook.Sheets[sheetName];

    // Conversion JSON
    const data = XLSX.utils.sheet_to_json(sheet);

    return {
      message: 'Fichier traité avec succès',
      rows: data.length,
      data,
    };
  }
}