import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from './customer.entity';
import { PendingDelivery, BatchInfo, HealthStatus, FarmVisit } from '../interfaces/chicken-tracking.interface';

@Entity('chicken_trackings')
export class ChickenTrackingEntity {
  @ApiProperty({
    description: 'Unique identifier of the tracking record',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customerId', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, customer => customer.chickenTrackings)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ApiProperty({
    description: 'Total number of chickens ordered',
    example: 1000
  })
  @Column({ type: 'int', default: 0 })
  totalOrdered: number;

  @ApiProperty({
    description: 'Total number of chickens received',
    example: 500
  })
  @Column({ type: 'int', default: 0 })
  totalReceived: number;

  @ApiProperty({
    description: 'Date of last delivery',
    example: '2024-02-06'
  })
  @Column({ type: 'timestamp', nullable: true })
  lastDeliveryDate: Date | null;

  @ApiProperty({
    description: 'List of pending deliveries',
    example: [{
      orderDate: '2024-01-15',
      quantity: 500,
      expectedDeliveryDate: '2024-03-01'
    }]
  })
  @Column({ type: 'jsonb', default: [] })
  pendingDeliveries: PendingDelivery[];

  @ApiProperty({
    description: 'Current batch information',
    example: {
      initialCount: 500,
      currentCount: 480,
      startDate: '2024-02-06',
      bandaCondition: 'GOOD',
      lastInspectionDate: '2024-02-15'
    }
  })
  @Column({ type: 'jsonb', nullable: true })
  currentBatch: BatchInfo | null;

  @ApiProperty({
    description: 'Health status information',
    example: {
      sickCount: 5,
      deadCount: 15,
      soldCount: 0,
      averageWeight: 1.8,
      averageAge: 45
    }
  })
  @Column({ type: 'jsonb', nullable: true })
  healthStatus: HealthStatus | null;

  @ApiProperty({
    description: 'Farm visits history',
    example: [{
      date: '2024-02-06',
      purpose: 'Initial Setup Inspection',
      findings: 'Banda preparation and water system check',
      recommendations: 'Cleanliness and ventilation guidelines'
    }]
  })
  @Column({ type: 'jsonb', default: [] })
  farmVisits: FarmVisit[];

  @ApiProperty({
    description: 'Batch history information',
    example: [{
      initialCount: 500,
      currentCount: 480,
      startDate: '2024-02-06',
      endDate: '2024-03-22',
      bandaCondition: 'GOOD',
      lastInspectionDate: '2024-02-15',
      healthStatus: {
        sickCount: 5,
        deadCount: 15,
        soldCount: 0,
        averageWeight: 1.8,
        averageAge: 45,
        mortalityRate: 3,
        survivalRate: 97
      }
    }]
  })
  
  @Column({ type: 'jsonb', default: [] })
  batchHistory: (BatchInfo & { endDate: Date | null; healthStatus: HealthStatus & { mortalityRate: number; survivalRate: number } })[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 