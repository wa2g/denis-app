import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from './customer.entity';
import { ChickenType } from '../enums/chicken-type.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { FeedOrder } from './feed-order.entity';

@Entity('chicken_orders')
export class ChickenOrder {
  @ApiProperty({
    description: 'Unique identifier of the chicken order',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Number of chickens paid for',
    example: 100
  })
  @Column({ name: 'chicken_paid', type: 'integer', default: 0 })
  chickenPaid: number;

  @ApiProperty({
    description: 'Number of chickens on loan',
    example: 50
  })
  @Column({ name: 'chicken_loan', type: 'integer', default: 0 })
  chickenLoan: number;

  @ApiProperty({
    description: 'Total number of chickens',
    example: 150
  })
  @Column({ name: 'total_chicken', type: 'integer', default: 0 })
  totalChicken: number;

  @ApiProperty({
    description: 'Type of chicken',
    enum: ChickenType,
    example: ChickenType.SASSO
  })
  @Column({
    type: 'enum',
    enum: ChickenType,
    name: 'type_of_chicken',
    default: ChickenType.SASSO
  })
  typeOfChicken: ChickenType;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PARTIAL
  })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    name: 'payment_status',
    default: PaymentStatus.UNPAID
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({
    description: 'Price per chicken',
    example: 5000.00
  })
  @Column('decimal', { precision: 10, scale: 2, name: 'price_per_chicken', default: 0 })
  pricePerChicken: number;

  @ApiProperty({
    description: 'Total price for all chickens',
    example: 750000.00
  })
  @Column('decimal', { precision: 10, scale: 2, name: 'total_chicken_price', default: 0 })
  totalChickenPrice: number;

  @ApiProperty({
    description: 'Amount paid',
    example: 1500.00
  })
  @Column('decimal', { precision: 10, scale: 2, name: 'amount_paid', default: 0 })
  amountPaid: number;

  @ApiProperty({
    description: 'Delivery date',
    example: '2024-03-01'
  })
  @Column({ type: 'date', name: 'delivery_date' })
  deliveryDate: Date;

  @ApiProperty({
    description: 'Receiving status',
    example: 'PENDING'
  })
  @Column({ name: 'receiving_status', default: 'PENDING' })
  receivingStatus: string;

  @ApiProperty({
    description: 'Ward',
    example: 'Msasani'
  })
  @Column()
  ward: string;

  @ApiProperty({
    description: 'Village',
    example: 'Mikoroshini'
  })
  @Column()
  village: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+255123456789'
  })
  @Column()
  phone: string;

  @ApiProperty({
    description: 'Batch number',
    example: 1
  })
  @Column({ type: 'integer' })
  batch: number;

  @ApiProperty({
    description: 'Is weekly order',
    example: false
  })
  @Column({ name: 'is_weekly_order', type: 'boolean', default: false })
  isWeeklyOrder: boolean;

  @ApiProperty({
    description: 'Order date',
    example: '2024-02-20'
  })
  @Column({ type: 'date', name: 'order_date' })
  orderDate: Date;

  @ManyToOne(() => Customer, customer => customer.chickenOrders)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @OneToMany(() => FeedOrder, feedOrder => feedOrder.chickenOrder, { cascade: true })
  feedOrders: FeedOrder[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 