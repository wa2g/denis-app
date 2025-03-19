import { IsEmail, IsEnum, IsString, MinLength, IsOptional } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';
import { CustomerCenter } from '../../customers/enums/customer-center.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'password123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    example: UserRole.ORDER_MANAGER
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Center assigned to the user',
    enum: CustomerCenter,
    example: CustomerCenter.KAHAMA,
    required: false
  })
  @IsEnum(CustomerCenter)
  @IsOptional()
  center?: CustomerCenter;
} 