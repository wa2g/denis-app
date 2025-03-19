import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { DocumentType } from '../enums/document-type.enum';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, invoice => invoice.documents)
  invoice: Invoice;

  @ManyToOne(() => User, user => user.documents)
  uploadedBy: User;

  @Column({
    type: 'enum',
    enum: DocumentType
  })
  documentType: DocumentType;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @CreateDateColumn()
  uploadedAt: Date;
} 