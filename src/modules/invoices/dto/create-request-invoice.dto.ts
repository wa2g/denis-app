import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateRequestInvoiceDto {
  @ApiProperty({
    description: 'ID of the approved request',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  requestId: string;

  @ApiProperty({
    description: 'Tax percentage (0-100)',
    example: 18,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxPercentage?: number;

  @ApiProperty({
    description: 'Additional notes or terms',
    example: 'Payment due within 30 days',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;
} 