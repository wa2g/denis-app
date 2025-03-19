import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestItemDto {
  @ApiProperty({
    description: 'Item number',
    example: 1
  })
  @IsNumber()
  @Min(1)
  itemNumber: number;

  @ApiProperty({
    description: 'Item description',
    example: 'Item description'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 1
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Unit price',
    example: 100
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({
    description: 'Total price',
    example: 100
  })
  @IsNumber()
  @Min(0)
  totalPrice: number;
}

export class CreateRequestDto {
  @ApiProperty({
    description: 'Task type',
    example: 'Services'
  })
  @IsString()
  @IsNotEmpty()
  taskType: string;

  @ApiProperty({
    description: 'Employee name',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  employeeName: string;

  @ApiProperty({
    description: 'Employee title',
    example: 'Manager'
  })
  @IsString()
  @IsNotEmpty()
  employeeTitle: string;

  @ApiProperty({
    description: 'Employee address',
    example: '123 Main St'
  })
  @IsString()
  @IsNotEmpty()
  employeeAddress: string;

  @ApiProperty({
    description: 'Employee phone',
    example: '+255123456789'
  })
  @IsString()
  @IsNotEmpty()
  employeePhone: string;

  @ApiProperty({
    description: 'Request items',
    type: [RequestItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestItemDto)
  items: RequestItemDto[];

  @ApiProperty({
    description: 'SpaDe employee who signed',
    example: 'Jane Doe'
  })
  @IsString()
  @IsNotEmpty()
  spadeEmployee: string;
} 