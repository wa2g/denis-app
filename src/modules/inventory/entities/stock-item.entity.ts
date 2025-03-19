import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

export enum StockType {
  SASSO_CHICKS = 'SASSO_CHICKS',
  BROILER_CHICKS = 'BROILER_CHICKS',
  FEED = 'FEED'
}

export enum StockStatus {
  PENDING = 'PENDING',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  FULLY_RECEIVED = 'FULLY_RECEIVED',
  APPROVED = 'APPROVED'
}

@Entity('stock_items')
export class StockItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: StockType
  })
  type: StockType;

  @Column({
    type: 'enum',
    enum: StockStatus,
    default: StockStatus.PENDING
  })
  status: StockStatus;

  @Column('decimal', { precision: 10, scale: 2, name: 'expected_quantity' })
  expectedQuantity: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, name: 'received_quantity' })
  receivedQuantity: number;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'received_by_id' })
  receivedBy: User;

  @Column({ name: 'received_by_id', nullable: true })
  receivedById: string;

  @Column({ name: 'received_date', nullable: true })
  receivedDate: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'accountant_approved_by_id' })
  accountantApprovedBy: User;

  @Column({ name: 'accountant_approved_by_id', nullable: true })
  accountantApprovedById: string;

  @Column({ name: 'accountant_approved_date', nullable: true })
  accountantApprovedDate: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 