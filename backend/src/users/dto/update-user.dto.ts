import { UserRole } from '../user.entity';

export class UpdateUserDto {
  fullname?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}