// upload.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { FichierExcel } from './entities/fichier-excel.entity';
import { DonneeProduction } from './entities/donnee-production.entity';
import { PosteCharge } from './entities/poste-charge.entity';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FichierExcel, DonneeProduction, PosteCharge]),
    LogsModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
