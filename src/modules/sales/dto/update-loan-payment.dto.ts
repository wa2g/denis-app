import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class UpdateLoanPaymentDto {
  @ApiProperty({
    description: 'The amount paid by the customer',
    example: 100.50
  })
  @IsNumber()
  @IsPositive()
  amountPaid: number;
} 