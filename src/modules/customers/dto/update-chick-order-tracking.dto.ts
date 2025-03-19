import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsDate, IsArray, ValidateNested, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

class PendingDeliveryDto {
  @ApiProperty({
    description: 'Date the order was placed',
    example: '2024-01-15'
  })
  @Type(() => Date)
  @IsDate()
  orderDate: Date;

  @ApiProperty({
    description: 'Quantity of chickens ordered',
    example: 500
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Expected delivery date',
    example: '2024-03-01'
  })
  @Type(() => Date)
  @IsDate()
  expectedDeliveryDate: Date;
}

class CurrentBatchDto {
  @ApiProperty({
    description: 'Initial count of chickens',
    example: 500
  })
  @IsNumber()
  @Min(0)
  initialCount: number;

  @ApiProperty({
    description: 'Current count of chickens',
    example: 480
  })
  @IsNumber()
  @Min(0)
  currentCount: number;

  @ApiProperty({
    description: 'Start date of the batch',
    example: '2024-02-06'
  })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({
    description: 'Condition of the banda',
    example: 'GOOD'
  })
  @IsString()
  bandaCondition: string;

  @ApiProperty({
    description: 'Date of last inspection',
    example: '2024-02-15'
  })
  @Type(() => Date)
  @IsDate()
  lastInspectionDate: Date;
}

class HealthStatusDto {
  @ApiProperty({
    description: 'Number of sick chickens',
    example: 5
  })
  @IsNumber()
  @Min(0)
  sickCount: number;

  @ApiProperty({
    description: 'Number of dead chickens',
    example: 15
  })
  @IsNumber()
  @Min(0)
  deadCount: number;

  @ApiProperty({
    description: 'Number of sold chickens',
    example: 0
  })
  @IsNumber()
  @Min(0)
  soldCount: number;

  @ApiProperty({
    description: 'Average weight in kg',
    example: 1.8
  })
  @IsNumber()
  @Min(0)
  averageWeight: number;

  @ApiProperty({
    description: 'Average age in days',
    example: 45
  })
  @IsNumber()
  @Min(0)
  averageAge: number;
}

class FarmVisitDto {
  @ApiProperty({
    description: 'Date of the farm visit',
    example: '2024-02-06'
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({
    description: 'Purpose of the visit',
    example: 'Initial Setup Inspection'
  })
  @IsString()
  purpose: string;

  @ApiProperty({
    description: 'Findings during the visit',
    example: 'Banda preparation and water system check'
  })
  @IsString()
  findings: string;

  @ApiProperty({
    description: 'Recommendations after the visit',
    example: 'Cleanliness and ventilation guidelines'
  })
  @IsString()
  recommendations: string;
}

export class UpdateChickOrderTrackingDto {
  @ApiProperty({
    description: 'Total number of chickens ordered',
    example: 1000
  })
  @IsNumber()
  @Min(0)
  totalOrdered: number;

  @ApiProperty({
    description: 'Total number of chickens received',
    example: 500
  })
  @IsNumber()
  @Min(0)
  totalReceived: number;

  @ApiProperty({
    description: 'Date of last delivery',
    example: '2024-02-06'
  })
  @Type(() => Date)
  @IsDate()
  lastDeliveryDate: Date;

  @ApiProperty({
    description: 'List of pending deliveries',
    type: [PendingDeliveryDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PendingDeliveryDto)
  pendingDeliveries: PendingDeliveryDto[];

  @ApiProperty({
    description: 'Current batch information',
    type: CurrentBatchDto
  })
  @ValidateNested()
  @Type(() => CurrentBatchDto)
  currentBatch: CurrentBatchDto;

  @ApiProperty({
    description: 'Health status information',
    type: HealthStatusDto
  })
  @ValidateNested()
  @Type(() => HealthStatusDto)
  healthStatus: HealthStatusDto;

  @ApiProperty({
    description: 'Farm visits history',
    type: [FarmVisitDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FarmVisitDto)
  farmVisits: FarmVisitDto[];
} 