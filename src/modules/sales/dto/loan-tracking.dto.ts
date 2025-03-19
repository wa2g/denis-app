import { ApiProperty } from '@nestjs/swagger';
import { CustomerCenter } from '../../customers/enums/customer-center.enum';

export class CreatorDto {
  @ApiProperty({
    description: 'Full name of the creator',
    example: 'John Doe'
  })
  name: string;

  @ApiProperty({
    description: 'Email of the creator',
    example: 'john.doe@example.com'
  })
  email: string;
}

class CustomerDto {
  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe'
  })
  name: string;

  @ApiProperty({
    description: 'Customer village',
    example: 'Village Name'
  })
  village: string;

  @ApiProperty({
    description: 'Customer center',
    enum: CustomerCenter,
    example: CustomerCenter.KAHAMA
  })
  center: CustomerCenter;
}

export class LoanTrackingDto {
  @ApiProperty({
    description: 'Total loan amount',
    example: 1000.00,
    type: Number
  })
  totalLoanAmount: number;

  @ApiProperty({
    description: 'Total number of loan sales',
    example: 5,
    type: Number
  })
  totalLoanSales: number;

  @ApiProperty({
    description: 'List of loan sales',
    type: 'array'
  })
  loanSales: Array<{
    id: string;
    customer: CustomerDto;
    totalAmount: number;
    amountPaid: number;
    remainingAmount: number;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    createdAt: Date;
    createdBy: CreatorDto;
  }>;
} 