import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  buyingPrice?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  sellingPrice?: number;
} 