export class UploadFileDto {
  // optionnel si tu veux ajouter info métier
  description?: string;

  zone?: string;

  type?: string; // ex: budget, charge, etc.
}