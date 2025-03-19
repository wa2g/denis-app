import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class AddFarmVisitDto {
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
    description: 'Recommendations given',
    example: 'Cleanliness and ventilation guidelines'
  })
  @IsString()
  recommendations: string;
} 