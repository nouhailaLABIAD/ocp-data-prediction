import { UserRole } from '../user.entity';

export class CreateUserDto {
  fullname!: string;

  email!: string;

  password!: string;

  role!: UserRole;
}
