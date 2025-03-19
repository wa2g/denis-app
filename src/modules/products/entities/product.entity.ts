import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inventory')
export class Product {
  @ApiProperty({
    description: 'Unique identifier of the product',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  productName: string;

  @ApiProperty()
  @Column()
  quantity: number;

  @ApiProperty()
  @Column()
  unity: string;

  @ApiProperty()
  @Column('numeric', { precision: 10, scale: 2 })
  buyingPrice: number;

  @ApiProperty()
  @Column('numeric', { precision: 10, scale: 2 })
  totalBuyingCost: number;

  @ApiProperty()
  @Column('numeric', { precision: 10, scale: 2 })
  sellingPrice: number;

  @ApiProperty()
  @Column({ default: 0 })
  totalSoldQtyLoan: number;

  @ApiProperty()
  @Column({ default: 0 })
  totalSoldQtyCash: number;

  @ApiProperty()
  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  totalSalesLoan: number;

  @ApiProperty()
  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  totalSalesCash: number;

  @ApiProperty()
  @Column()
  remainingQty: number;

  @ApiProperty()
  @Column('numeric', { precision: 10, scale: 2 })
  remainingBuying: number;

  @ApiProperty()
  @Column('numeric', { precision: 10, scale: 2 })
  remainingSales: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
} 