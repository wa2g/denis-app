import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { RequestStatus } from '../enums/request-status.enum';

@Entity('requests')
export class Request {
  @ApiProperty({
    description: 'Unique identifier of the request',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Request number',
    example: '7571'
  })
  @Column()
  requestNumber: string;

  @ApiProperty({
    description: 'Request date',
    example: '2024-01-29'
  })
  @Column({ type: 'date' })
  requestDate: Date;

  @ApiProperty({
    description: 'Task type',
    example: 'Services'
  })
  @Column()
  taskType: string;

  @ApiProperty({
    description: 'Employee name',
    example: 'John Doe'
  })
  @Column()
  employeeName: string;

  @ApiProperty({
    description: 'Employee title',
    example: 'Manager'
  })
  @Column()
  employeeTitle: string;

  @ApiProperty({
    description: 'Employee address',
    example: '123 Main St'
  })
  @Column()
  employeeAddress: string;

  @ApiProperty({
    description: 'Employee phone',
    example: '+255123456789'
  })
  @Column()
  employeePhone: string;

  @ApiProperty({
    description: 'Request items',
    example: [{
      itemNumber: 1,
      description: 'Item description',
      quantity: 1,
      unitPrice: 100,
      totalPrice: 100
    }]
  })
  @Column('jsonb')
  items: {
    itemNumber: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];

  @ApiProperty({
    description: 'Invoice subtotal',
    example: 100
  })
  @Column('decimal', { precision: 10, scale: 2 })
  invoiceSubtotal: number;

  @ApiProperty({
    description: 'Transaction charges',
    example: 0
  })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  transactionCharges: number;

  @ApiProperty({
    description: 'Total amount',
    example: 100
  })
  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @ApiProperty({
    description: 'Request status',
    enum: RequestStatus,
    example: RequestStatus.PENDING
  })
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING
  })
  status: RequestStatus;

  @ApiProperty({
    description: 'SpaDe employee who signed',
    example: 'Jane Doe'
  })
  @Column({ nullable: true })
  spadeEmployee: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ type: 'uuid', nullable: true })
  approvedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 