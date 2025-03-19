import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../enums/order-status.enum';

export class OrderItemDto {
  @ApiProperty()
  quantity: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;
}

export class OrderDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  companyName: string;

  @ApiProperty()
  farmName: string;

  @ApiProperty()
  farmNumber: string;

  @ApiProperty()
  villageName: string;

  @ApiProperty()
  region: string;

  @ApiProperty()
  pobox: string;

  @ApiProperty()
  contactName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  preparedBy: string;

  @ApiProperty({ required: false })
  approvedBy?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 