import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ChickenOrder } from './chicken-order.entity';
import { FeedType } from '../enums/feed-type.enum';
import { FeedCompany } from '../enums/feed-company.enum';

@Entity('feed_orders')
export class FeedOrder {
  @ApiProperty({
    description: 'Unique identifier of the feed order',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Type of feed',
    enum: FeedType
  })
  @Column({
    type: 'enum',
    enum: FeedType,
    name: 'feed_type'
  })
  feedType: FeedType;

  @ApiProperty({
    description: 'Feed company',
    enum: FeedCompany
  })
  @Column({
    type: 'enum',
    enum: FeedCompany
  })
  company: FeedCompany;

  @ApiProperty({
    description: 'Quantity of feed ordered',
    example: 50
  })
  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @ApiProperty({
    description: 'Price per unit',
    example: 25000
  })
  @Column('decimal', { precision: 10, scale: 2, name: 'price_per_unit' })
  pricePerUnit: number;

  @ApiProperty({
    description: 'Total price for this feed order',
    example: 1250000
  })
  @Column('decimal', { precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @ManyToOne(() => ChickenOrder, order => order.feedOrders)
  @JoinColumn({ name: 'chicken_order_id' })
  chickenOrder: ChickenOrder;

  @Column({ type: 'uuid', name: 'chicken_order_id', nullable: true })
  chickenOrderId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 