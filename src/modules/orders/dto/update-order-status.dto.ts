import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../enums/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, description: 'New status for the order' })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ required: false, description: 'Reason for cancellation (required when cancelling)' })
  @IsString()
  @IsOptional()
  reason?: string;
} 