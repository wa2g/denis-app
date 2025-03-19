import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDate, IsOptional, Min, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FarmVisitDto } from './farm-visit.dto';

export class BatchProgressEntryDto {
  @ApiProperty({
    description: 'Date of the progress entry',
    example: '2024-03-20'
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({
    description: 'Current count of chickens',
    example: 480
  })
  @IsNumber()
  @Min(0)
  currentCount: number;

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

  @ApiProperty({
    description: 'Condition of the banda',
    example: 'GOOD'
  })
  @IsString()
  bandaCondition: string;

  @ApiProperty({
    description: 'Additional notes about this progress entry',
    example: 'Chickens are growing well, eating properly',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBatchTrackingDto {
  @ApiProperty({
    description: 'Initial count of chickens',
    example: 500
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  initialCount?: number;

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
  @IsOptional()
  startDate?: Date;

  @ApiProperty({
    description: 'End date of the batch (if completing)',
    example: '2024-03-22',
    required: false
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiProperty({
    description: 'Whether this batch is complete and should be moved to history',
    example: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  completeBatch?: boolean;

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

  @ApiProperty({
    description: 'New farm visits to add',
    type: [FarmVisitDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FarmVisitDto)
  @IsOptional()
  farmVisits?: FarmVisitDto[];

  @ApiProperty({
    description: 'Additional notes for this progress entry',
    example: 'Chickens are growing well, eating properly',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;
} 