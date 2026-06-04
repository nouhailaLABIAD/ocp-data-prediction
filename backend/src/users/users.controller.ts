import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,              // ✅ AJOUT
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto, @Req() req: any) {   // ✅ AJOUT @Req()
    return this.usersService.createUser(createUserDto, req.user);    // ✅ passe req.user
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,                                                 // ✅ AJOUT @Req()
  ) {
    return this.usersService.updateUser(Number(id), updateUserDto, req.user); // ✅ passe req.user
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {                // ✅ AJOUT @Req()
    return this.usersService.deleteUser(Number(id), req.user);       // ✅ passe req.user
  }
}