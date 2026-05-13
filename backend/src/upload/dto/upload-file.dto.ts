// upload-file.dto.ts
export class UploadFileDto {
  type!:  'PRODUCTION' | 'CHARGES' | 'RECAP';
  mois!:  string;
  annee!: number;
}