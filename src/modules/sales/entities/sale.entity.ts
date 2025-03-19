import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType } from '../enums/payment-type.enum';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('sales')
export class Sale {
  @ApiProperty({
    description: 'Unique identifier of the sale',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Type of payment used for the sale',
    enum: PaymentType,
    example: PaymentType.CASH
  })
  @Column({
    type: 'enum',
    enum: PaymentType
  })
  paymentType: PaymentType;

  @ApiProperty({
    description: 'List of items included in the sale',
    example: [{
      productId: '123e4567-e89b-12d3-a456-426614174000',
      productName: 'Product A',
      quantity: 2,
      unitPrice: 10.50,
      totalPrice: 21.00
    }]
  })
  @Column({ type: 'jsonb' })
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];

  @ApiProperty({
    description: 'Total amount of the sale',
    example: 21.00
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @ApiProperty({
    description: 'Amount paid for the sale',
    example: 21.00
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @ApiProperty({
    description: 'Remaining amount to be paid',
    example: 0.00
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  remainingAmount: number;

  @ApiProperty({
    description: 'History of payments made',
    example: [{
      amount: 10.00,
      date: '2024-01-20T15:30:00Z',
      updatedBy: '123e4567-e89b-12d3-a456-426614174000'
    }]
  })
  @Column({ type: 'jsonb', nullable: true })
  paymentHistory: Array<{
    amount: number;
    date: Date;
    updatedBy: string;
  }>;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => Customer, customer => customer.sales, { nullable: false })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'uuid' })
  customerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 