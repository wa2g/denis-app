import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsEnum, IsDate, ValidateNested, IsNumber, IsPositive, IsArray, IsOptional, IsEmail } from 'class-validator';
import { CustomerSex } from '../enums/customer-sex.enum';
import { CustomerCenter } from '../enums/customer-center.enum';
import { ChickenType } from '../enums/chicken-type.enum';
import { FeedType } from '../enums/feed-type.enum';
import { FeedCompany } from '../enums/feed-company.enum';

class FeedOrderDto {
  @ApiProperty({
    description: 'Type of feed',
    enum: FeedType
  })
  @IsEnum(FeedType)
  feedType: FeedType;

  @ApiProperty({
    description: 'Feed company',
    enum: FeedCompany
  })
  @IsEnum(FeedCompany)
  company: FeedCompany;

  @ApiProperty({
    description: 'Quantity of feed',
    example: 50
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Price per unit',
    example: 25000
  })
  @IsNumber()
  @IsPositive()
  pricePerUnit: number;
}

class OrderDetailsDto {
  @ApiProperty({
    description: 'Number of chickens paid for',
    example: 100
  })
  @IsNumber()
  @IsPositive()
  chickenPaid: number;

  @ApiProperty({
    description: 'Number of chickens on loan',
    example: 50
  })
  @IsNumber()
  @IsPositive()
  chickenLoan: number;

  @ApiProperty({
    description: 'Type of chicken',
    enum: ChickenType
  })
  @IsEnum(ChickenType)
  typeOfChicken: ChickenType;

  @ApiProperty({
    description: 'Price per chicken',
    example: 5000
  })
  @IsNumber()
  @IsPositive()
  pricePerChicken: number;

  @ApiProperty({
    description: 'Delivery date',
    example: '2024-03-01'
  })
  @IsDate()
  @Type(() => Date)
  deliveryDate: Date;

  @ApiProperty({
    description: 'Feed orders',
    type: [FeedOrderDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeedOrderDto)
  feedOrders: FeedOrderDto[];
}

export class CreateCustomerWithOrderDto {
  @ApiProperty({
    description: 'Name of the customer',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+255123456789'
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
    required: false
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Customer sex',
    enum: CustomerSex
  })
  @IsEnum(CustomerSex)
  sex: CustomerSex;

  @ApiProperty({
    description: 'Customer center',
    enum: CustomerCenter,
    required: false
  })
  @IsEnum(CustomerCenter)
  @IsOptional()
  center?: CustomerCenter;

  @ApiProperty({
    description: 'Place of farming',
    example: 'Kahama Farm',
    required: false
  })
  @IsString()
  @IsOptional()
  farmingPlace?: string;

  @ApiProperty({
    description: 'Village name',
    example: 'Mikoroshini'
  })
  @IsString()
  @IsNotEmpty()
  village: string;

  @ApiProperty({
    description: 'Street name',
    example: 'Msasani Street'
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    description: 'District name',
    example: 'Kahama'
  })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({
    description: 'Region (Mkoa)',
    example: 'Shinyanga'
  })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({
    description: 'State',
    example: 'Tanzania'
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: 'Order details'
  })
  @ValidateNested()
  @Type(() => OrderDetailsDto)
  order: OrderDetailsDto;
} 