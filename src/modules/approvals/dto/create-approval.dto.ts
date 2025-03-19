import { IsEnum, IsString, IsUUID, IsOptional } from 'class-validator';
import { ApprovalStatus } from '../enums/approval-status.enum';

export class CreateApprovalDto {
  @IsUUID()
  invoiceId: string;

  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @IsString()
  @IsOptional()
  comments?: string;
} 