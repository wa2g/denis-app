import { IsEnum, IsArray, ValidateNested, IsUUID, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType } from '../enums/payment-type.enum';

export class SaleItemDto {
  @ApiProperty({
    description: 'ID of the product from inventory',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product to be sold',
    example: 2,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateSaleDto {
  @ApiProperty({
    description: 'ID of the customer making the purchase',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Type of payment for the sale',
    enum: PaymentType,
    example: PaymentType.CASH
  })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({
    description: 'List of items to be sold',
    type: [SaleItemDto],
    example: [{
      productId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 2
    }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
} 