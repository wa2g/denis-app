import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class FarmVisitDto {
  @ApiProperty({
    description: 'Date of the farm visit',
    example: '2024-03-25'
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({
    description: 'Purpose of the visit',
    example: 'Regular health check'
  })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({
    description: 'Findings during the visit',
    example: 'All chickens appear healthy, proper feeding observed'
  })
  @IsString()
  @IsNotEmpty()
  findings: string;

  @ApiProperty({
    description: 'Recommendations after the visit',
    example: 'Continue with current feeding schedule, maintain cleanliness'
  })
  @IsString()
  @IsNotEmpty()
  recommendations: string;
} 