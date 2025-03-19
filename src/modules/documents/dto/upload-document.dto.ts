import { IsEnum, IsUUID } from 'class-validator';
import { DocumentType } from '../enums/document-type.enum';

export class UploadDocumentDto {
  @IsUUID()
  invoiceId: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;
} 