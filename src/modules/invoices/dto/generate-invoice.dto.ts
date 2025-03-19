import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceType } from '../enums/invoice-type.enum';

export class GenerateInvoiceDto {
  @ApiProperty({
    description: 'The order number for which to generate the invoice',
    example: 'ORD-2023-0001'
  })
  @IsString()
  orderNumber: string;

  @ApiProperty({
    description: 'Type of invoice to generate',
    enum: InvoiceType,
    example: InvoiceType.PURCHASE
  })
  @IsEnum(InvoiceType)
  type: InvoiceType;
} 