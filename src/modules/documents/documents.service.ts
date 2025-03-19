import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { UploadDocumentDto } from './dto/upload-document.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {}

  async upload(
    file: Express.Multer.File,
    uploadDocumentDto: UploadDocumentDto,
    uploaderId: string,
  ): Promise<Document> {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Create document record
    const document = this.documentsRepository.create({
      fileName,
      filePath,
      documentType: uploadDocumentDto.documentType,
      invoice: { id: uploadDocumentDto.invoiceId },
      uploadedBy: { id: uploaderId },
    });

    return this.documentsRepository.save(document);
  }

  async findByInvoice(invoiceId: string): Promise<Document[]> {
    return this.documentsRepository.find({
      where: { invoice: { id: invoiceId } },
      relations: ['uploadedBy'],
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['uploadedBy', 'invoice'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }
} 