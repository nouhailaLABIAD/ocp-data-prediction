import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe());

  const usersService = app.get(UsersService);

  await usersService.createAdmin();

  await app.listen(3000);

  console.log('Server running on http://localhost:3000');
}
bootstrap();
