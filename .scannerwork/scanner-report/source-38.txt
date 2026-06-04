import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
@Post('logout')
@UseGuards(JwtAuthGuard)
logout(@Req() req: any) {
  return this.authService.logout(req.user);
}
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ) {
    return this.authService.login(
      body.email,
      body.password,
    );
  }
}

