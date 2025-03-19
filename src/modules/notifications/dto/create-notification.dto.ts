import { IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  recipientId: string;

  @IsString()
  message: string;
} 