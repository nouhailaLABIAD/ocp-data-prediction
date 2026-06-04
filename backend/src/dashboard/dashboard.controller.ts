// dashboard.controller.ts
// Ajouter dans ton module NestJS (ex: UploadModule ou un nouveau DashboardModule)

import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('charges')
  async getCharges(@Req() req: any) {
    return this.dashboardService.getCharges(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('production')
  async getProduction(@Req() req: any) {
    return this.dashboardService.getProduction(req.user);
  }
}