import { IsEnum, IsNumber, IsString, IsUUID, Min, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceType } from '../enums/invoice-type.enum';

class InvoiceItemDto {
  @ApiProperty({
    description: 'Description of the item',
    example: 'Item description'
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Quantity of the item',
    example: 1
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Unit price of the item',
    example: 100
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({
    description: 'Total price of the item',
    example: 100
  })
  @IsNumber()
  @Min(0)
  totalPrice: number;
}

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'The order ID for which to create the invoice',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'Total amount of the invoice',
    example: 100
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Type of invoice',
    enum: InvoiceType,
    example: InvoiceType.PURCHASE
  })
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @ApiProperty({
    description: 'Description of the invoice',
    example: 'Invoice for order ORD-2024-001'
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Invoice items',
    type: [InvoiceItemDto],
    example: [{
      description: 'Item description',
      quantity: 1,
      unitPrice: 100,
      totalPrice: 100
    }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({
    description: 'Additional notes',
    example: 'Payment due within 30 days',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;
} 