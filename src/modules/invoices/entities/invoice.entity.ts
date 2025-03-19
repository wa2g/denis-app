import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { Document } from '../../documents/entities/document.entity';
import { Approval } from '../../approvals/entities/approval.entity';
import { InvoiceType } from '../enums/invoice-type.enum';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Request } from '../../requests/entities/request.entity';

@Entity('invoices')
export class Invoice {
  @ApiProperty({
    description: 'Unique identifier of the invoice',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Invoice number',
    example: 'INV-20240129-001'
  })
  @Column()
  invoiceNumber: string;

  @ApiProperty({
    description: 'Invoice date',
    example: '2024-01-29'
  })
  @Column({ type: 'date' })
  invoiceDate: Date;

  @ApiProperty({
    description: 'Due date',
    example: '2024-02-29'
  })
  @Column({ type: 'date' })
  dueDate: Date;

  @ApiProperty({
    description: 'Type of invoice',
    enum: InvoiceType,
    example: 'REQUEST',
    enumName: 'InvoiceType'
  })
  @Column({
    type: 'enum',
    enum: InvoiceType
  })
  type: InvoiceType;

  @ApiProperty({
    description: 'Invoice items',
    example: [{
      description: 'Item description',
      quantity: 1,
      unitPrice: 100,
      totalPrice: 100
    }]
  })
  @Column('jsonb')
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];

  @ApiProperty({
    description: 'Subtotal amount',
    example: 100
  })
  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @ApiProperty({
    description: 'Tax amount',
    example: 18
  })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tax: number;

  @ApiProperty({
    description: 'Total amount',
    example: 118
  })
  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @ApiProperty({
    description: 'Invoice status',
    enum: InvoiceStatus,
    example: InvoiceStatus.PENDING
  })
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING
  })
  status: InvoiceStatus;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy: User;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById: string;

  @ApiProperty({
    description: 'Notes or terms',
    example: 'Payment due within 30 days'
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ type: () => Request })
  @ManyToOne(() => Request, { nullable: true })
  @JoinColumn({ name: 'request_id' })
  request: Request;

  @Column({ name: 'request_id', nullable: true })
  requestId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ type: () => Order })
  @ManyToOne(() => Order, order => order.invoices)
  order: Order;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, user => user.createdInvoices)
  accountant: User;

  @ApiProperty({ type: () => [Document] })
  @OneToMany(() => Document, document => document.invoice)
  documents: Document[];

  @ApiProperty({ type: () => [Approval] })
  @OneToMany(() => Approval, approval => approval.invoice)
  approvals: Approval[];
} 