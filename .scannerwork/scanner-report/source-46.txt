// dashboard.module.ts
// À créer dans src/dashboard/ et importer dans AppModule

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PosteCharge } from '../upload/entities/poste-charge.entity';
import { DonneeProduction } from '../upload/entities/donnee-production.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PosteCharge, DonneeProduction])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}