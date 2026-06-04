import { Injectable } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  validate(payload: any) {
    // On évite require-await (pas de besoin d'async ici)
    return {
      userId: payload?.sub as number,
      email: payload?.email as string,
      role: payload?.role as string,
    };
  }
}
