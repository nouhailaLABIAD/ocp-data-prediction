
import * as multer from 'multer';

// upload.controller.ts
import {
  Controller, Post, UseInterceptors, UploadedFile,
  UseGuards, BadRequestException, Body, Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type')  type:  string,
    @Body('mois')  mois:  string,
    @Body('annee') annee: string,
    @Req() req: any,
  ) {
    if (!file)  throw new BadRequestException('Aucun fichier envoyé');
    if (!type)  throw new BadRequestException('Type requis');
    if (!mois)  throw new BadRequestException('Mois requis');
    if (!annee) throw new BadRequestException('Année requise');

    return this.uploadService.processExcel(
      file, type, mois, parseInt(annee), req.user,
    );
  }
}