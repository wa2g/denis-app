import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unity: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  buyingPrice: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  sellingPrice: number;
} 