import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { FichierExcel } from './upload/entities/fichier-excel.entity';
import { DonneeProduction } from './upload/entities/donnee-production.entity';
import { PosteCharge } from './upload/entities/poste-charge.entity';
import { LogsModule } from './logs/logs.module';
import { Log } from './logs/entities/log.entity';
import { DashboardModule } from './dashboard/dashboard.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT') || '5432'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [User, FichierExcel, DonneeProduction, PosteCharge, Log],
        synchronize: true,
      }),
    }),

    UsersModule,
    AuthModule,
    UploadModule,
    LogsModule,
    DashboardModule,
  ],
})
export class AppModule {}
