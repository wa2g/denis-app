import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePricingDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({ example: 100, description: 'Number of chickens per box' })
  chickensPerBox?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({ example: 5000.00, description: 'Price per box' })
  pricePerBox?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({ example: 55.00, description: 'Selling price per chicken' })
  sellingPricePerChicken?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({ example: 45.00, description: 'Buying price per chicken' })
  buyingPricePerChicken?: number;
} 