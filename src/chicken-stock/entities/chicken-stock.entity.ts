import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ChickenType } from '../types/chicken-type.enum';

@Entity('chicken_stock')
export class ChickenStock {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: 'uuid' })
  id: string;

  @Column({
    type: 'enum',
    enum: ChickenType,
    unique: true,
  })
  @ApiProperty({ example: ChickenType.BROILER })
  chickenType: ChickenType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ example: 1000 })
  currentQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ example: 5000 })
  totalReceived: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ example: 4000 })
  totalSold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 100 })
  @ApiProperty({ example: 100 })
  minimumStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ example: 10, description: 'Number of boxes currently in stock' })
  numberOfBoxes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 100 })
  @ApiProperty({ example: 100, description: 'Number of chickens per box' })
  chickensPerBox: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ example: 5000.00, description: 'Price per box' })
  pricePerBox: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ example: 55.00, description: 'Selling price per chicken' })
  sellingPricePerChicken: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ example: 45.00, description: 'Buying price per chicken' })
  buyingPricePerChicken: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ example: 50000.00, description: 'Total value of boxes in stock' })
  totalBoxValue: number;

  @CreateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;
} 