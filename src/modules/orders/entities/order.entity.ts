import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { OrderStatus } from '../enums/order-status.enum';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('orders')
export class Order {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'company_name' })
  companyName: string;

  @ApiProperty()
  @Column({ name: 'farm_name' })
  farmName: string;

  @ApiProperty()
  @Column({ name: 'farm_number' })
  farmNumber: string;

  @ApiProperty()
  @Column({ name: 'village_name' })
  villageName: string;

  @ApiProperty()
  @Column({ name: 'contact_name' })
  contactName: string;

  @ApiProperty()
  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @ApiProperty()
  @Column('jsonb')
  items: Array<{
    quantity: number;
    description: string;
    unitPrice: number;
    totalPrice: number;
  }>;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Invoice, invoice => invoice.order)
  invoices: Invoice[];

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'order_manager_id' })
  orderManager: User;

  @Column({ name: 'order_manager_id', nullable: true })
  orderManagerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy: User;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById: string;

  @ApiProperty()
  @Column({ name: 'order_number' })
  orderNumber: string;

  @ApiProperty()
  @Column()
  date: Date;

  @ApiProperty()
  @Column()
  region: string;

  @ApiProperty()
  @Column()
  pobox: string;
} 