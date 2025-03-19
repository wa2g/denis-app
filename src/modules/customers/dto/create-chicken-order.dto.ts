import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum, IsString, IsDate, Min, IsUUID, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChickenType } from '../enums/chicken-type.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { FeedType } from '../enums/feed-type.enum';
import { FeedCompany } from '../enums/feed-company.enum';

export class CreateFeedOrderDto {
  @ApiProperty({
    description: 'Type of feed',
    enum: FeedType
  })
  @IsEnum(FeedType)
  feedType: FeedType;

  @ApiProperty({
    description: 'Feed company',
    enum: FeedCompany
  })
  @IsEnum(FeedCompany)
  company: FeedCompany;

  @ApiProperty({
    description: 'Quantity of feed',
    example: 50
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Price per unit',
    example: 25000
  })
  @IsNumber()
  @Min(0)
  pricePerUnit: number;
}

export class CreateChickenOrderDto {
  @ApiProperty({
    description: 'Number of chickens paid for',
    example: 100
  })
  @IsNumber()
  @Min(0)
  chickenPaid: number;

  @ApiProperty({
    description: 'Number of chickens on loan',
    example: 50
  })
  @IsNumber()
  @Min(0)
  chickenLoan: number;

  @ApiProperty({
    description: 'Total number of chickens',
    example: 150
  })
  @IsNumber()
  @Min(0)
  totalChicken: number;

  @ApiProperty({
    description: 'Type of chicken',
    enum: ChickenType,
    example: ChickenType.SASSO
  })
  @IsEnum(ChickenType)
  typeOfChicken: ChickenType;

  @ApiProperty({
    description: 'Price per chicken (optional - will use current selling price if not provided)',
    example: 5000.00,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price per chicken must be a number with at most 2 decimal places' })
  @Min(0, { message: 'Price per chicken must be greater than or equal to 0' })
  pricePerChicken?: number | null;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PARTIAL
  })
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiProperty({
    description: 'Amount paid',
    example: 1500.00
  })
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @ApiProperty({
    description: 'Ward',
    example: 'Msasani'
  })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({
    description: 'Village',
    example: 'Mikoroshini'
  })
  @IsString()
  @IsNotEmpty()
  village: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+255123456789'
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Batch number',
    example: 1
  })
  @IsNumber()
  @Min(1)
  batch: number;

  @ApiProperty({
    description: 'Order date',
    example: '2024-02-20'
  })
  @Type(() => Date)
  @IsDate()
  orderDate: Date;

  @ApiProperty({
    description: 'Delivery date',
    example: '2024-03-01'
  })
  @Type(() => Date)
  @IsDate()
  deliveryDate: Date;

  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    description: 'Feed orders',
    type: [CreateFeedOrderDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFeedOrderDto)
  feedOrders: CreateFeedOrderDto[];
} 