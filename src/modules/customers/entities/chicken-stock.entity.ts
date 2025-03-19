import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ChickenType } from '../enums/chicken-type.enum';

@Entity('chicken_stock')
export class ChickenStock {
  @ApiProperty({
    description: 'Unique identifier of the stock record',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Type of chicken',
    enum: ChickenType,
    example: ChickenType.SASSO
  })
  @Column({
    type: 'enum',
    enum: ChickenType
  })
  chickenType: ChickenType;

  @ApiProperty({
    description: 'Current quantity in stock',
    example: 1000
  })
  @Column()
  currentQuantity: number;

  @ApiProperty({
    description: 'Total chickens received',
    example: 5000
  })
  @Column()
  totalReceived: number;

  @ApiProperty({
    description: 'Total chickens sold',
    example: 4000
  })
  @Column()
  totalSold: number;

  @ApiProperty({
    description: 'Minimum stock level for alerts',
    example: 100
  })
  @Column()
  minimumStock: number;

  @ApiProperty({
    description: 'Number of boxes in stock',
    example: 10
  })
  @Column({ default: 0 })
  numberOfBoxes: number;

  @ApiProperty({
    description: 'Number of chickens per box',
    example: 100
  })
  @Column({ default: 100 })
  chickensPerBox: number;

  @ApiProperty({
    description: 'Price per box',
    example: 500.00
  })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  pricePerBox: number;

  @ApiProperty({
    description: 'Selling price per chicken',
    example: 5.50
  })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  sellingPricePerChicken: number;

  @ApiProperty({
    description: 'Buying price per chicken',
    example: 4.50
  })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  buyingPricePerChicken: number;

  @ApiProperty({
    description: 'Total value of boxes in stock',
    example: 5000.00
  })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: number) => value
    }
  })
  totalBoxValue: number;

  @ApiProperty({
    description: 'Last stock update date',
    example: '2024-02-20T12:00:00Z'
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Last modification date',
    example: '2024-02-20T12:00:00Z'
  })
  @UpdateDateColumn()
  updatedAt: Date;
} 