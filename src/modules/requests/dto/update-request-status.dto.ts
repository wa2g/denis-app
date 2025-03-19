import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { RequestStatus } from '../enums/request-status.enum';

export class UpdateRequestStatusDto {
  @ApiProperty({
    description: 'New status for the request',
    enum: RequestStatus,
    example: RequestStatus.APPROVED
  })
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @ApiProperty({
    description: 'Comments about the status change',
    example: 'Request approved for processing',
    required: false
  })
  @IsString()
  @IsOptional()
  comments?: string;
} 