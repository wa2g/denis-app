import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Sale } from '../../sales/entities/sale.entity';
import { User } from '../../users/entities/user.entity';
import { ChickenOrder } from './chicken-order.entity';
import { CustomerSex } from '../enums/customer-sex.enum';
import { CustomerCenter } from '../enums/customer-center.enum';
import { ChickenTrackingEntity } from './chicken-tracking.entity';

@Entity('customers')
export class Customer {
  @ApiProperty({
    description: 'Unique identifier of the customer',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Full name of the customer',
    example: 'John Doe'
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Contact number of the customer',
    example: '+255123456789'
  })
  @Column()
  phone: string;

  @ApiProperty({
    description: 'Email address of the customer',
    example: 'john.doe@example.com',
    required: false
  })
  @Column({ nullable: true })
  email: string;

  @ApiProperty({
    description: 'Customer sex',
    enum: CustomerSex,
    example: CustomerSex.MALE
  })
  @Column({
    type: 'enum',
    enum: CustomerSex
  })
  sex: CustomerSex;

  @ApiProperty({
    description: 'Customer center',
    enum: CustomerCenter,
    example: CustomerCenter.KAHAMA
  })
  @Column({
    type: 'enum',
    enum: CustomerCenter
  })
  center: CustomerCenter;

  @ApiProperty({
    description: 'Place of farming',
    example: 'Kahama Farm',
    required: false
  })
  @Column({ nullable: true })
  farmingPlace: string;

  @ApiProperty({
    description: 'Village name',
    example: 'Mikoroshini'
  })
  @Column()
  village: string;

  @ApiProperty({
    description: 'Street name',
    example: 'Msasani Street'
  })
  @Column()
  street: string;

  @ApiProperty({
    description: 'District name',
    example: 'Kahama'
  })
  @Column()
  district: string;

  @ApiProperty({
    description: 'Region (Mkoa)',
    example: 'Shinyanga'
  })
  @Column()
  region: string;

  @ApiProperty({
    description: 'State',
    example: 'Tanzania'
  })
  @Column()
  state: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'uuid' })
  createdById: string;

  @OneToMany(() => Sale, sale => sale.customer)
  sales: Sale[];

  @OneToMany(() => ChickenOrder, chickenOrder => chickenOrder.customer)
  chickenOrders: ChickenOrder[];

  @OneToMany(() => ChickenTrackingEntity, tracking => tracking.customer)
  chickenTrackings: ChickenTrackingEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 