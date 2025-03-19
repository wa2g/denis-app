import { IsString, IsNumber, Min, IsArray, ValidateNested, IsPhoneNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class OrderItemDto {
  @ApiProperty({
    example: 2,
    description: 'Quantity of the product'
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 'Fertilizer NPK',
    description: 'Description of the product'
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 100.00,
    description: 'Unit price of the product'
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({
    example: 200.00,
    description: 'Total price for this product (quantity * unitPrice)'
  })
  @IsNumber()
  @Min(0)
  totalPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({
    example: 'Farming Solutions Ltd',
    description: 'Name of the company'
  })
  @IsString()
  companyName: string;

  @ApiProperty({
    example: 'Green Acres Farm',
    description: 'Name of the farm'
  })
  @IsString()
  farmName: string;

  @ApiProperty({
    example: 'F123456',
    description: 'Farm registration number'
  })
  @IsString()
  farmNumber: string;

  @ApiProperty({
    example: 'Mtendere',
    description: 'Village name'
  })
  @IsString()
  villageName: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the contact person'
  })
  @IsString()
  contactName: string;

  @ApiProperty({
    example: '+260977123456',
    description: 'Phone number of the contact person'
  })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty({
    type: [OrderItemDto],
    description: 'List of ordered items'
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    example: 1500.50,
    description: 'Total amount for all items'
  })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({
    example: 'ORD123456',
    description: 'Unique order number'
  })
  @IsString()
  orderNumber: string;

  @ApiProperty({
    example: '2023-10-15',
    description: 'Date of the order'
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 'Central Province',
    description: 'Region of the order'
  })
  @IsString()
  region: string;

  @ApiProperty({
    example: 'P.O. Box 123',
    description: 'P.O. Box address'
  })
  @IsString()
  pobox: string;
} 