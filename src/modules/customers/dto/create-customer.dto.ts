import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerSex } from '../enums/customer-sex.enum';
import { CustomerCenter } from '../enums/customer-center.enum';
import { CreateChickenOrderDto } from './create-chicken-order.dto';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Name of the customer',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Customer center',
    enum: CustomerCenter,
    example: CustomerCenter.KAHAMA
  })
  @IsEnum(CustomerCenter)
  center: CustomerCenter;

  @ApiProperty({
    description: 'Customer sex',
    enum: CustomerSex,
    example: CustomerSex.MALE
  })
  @IsEnum(CustomerSex)
  sex: CustomerSex;

  @ApiProperty({
    description: 'Customer ward',
    example: 'Msasani'
  })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({
    description: 'Customer village',
    example: 'Mikoroshini'
  })
  @IsString()
  @IsNotEmpty()
  village: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+255123456789'
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Place of farming',
    example: 'Kahama Farm',
    required: false
  })
  @IsString()
  @IsOptional()
  farmingPlace?: string;

  @ApiProperty({
    description: 'Chicken orders for the customer',
    type: [CreateChickenOrderDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChickenOrderDto)
  @IsOptional()
  chickenOrders?: CreateChickenOrderDto[];
} 