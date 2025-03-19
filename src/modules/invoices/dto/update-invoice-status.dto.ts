import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '../enums/invoice-status.enum';

export class UpdateInvoiceStatusDto {
  @ApiProperty({
    enum: InvoiceStatus,
    description: `New status for the invoice. Available transitions:
    - Manager: PENDING → MANAGER_APPROVED
    - CEO: MANAGER_APPROVED → APPROVED
    - Both can set to CANCELLED`,
    example: InvoiceStatus.MANAGER_APPROVED,
    enumName: 'InvoiceStatus'
  })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @ApiProperty({
    required: false,
    description: 'Reason for cancellation (required when setting status to CANCELLED)',
    example: 'Invoice amounts do not match order details',
    nullable: true
  })
  @IsString()
  @IsOptional()
  reason?: string;
} 