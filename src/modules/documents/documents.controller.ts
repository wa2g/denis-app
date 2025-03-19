import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @Roles(UserRole.ACCOUNTANT)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Request() req,
    @UploadedFile() file: Express.Multer.File, 
    @Body() uploadDocumentDto: UploadDocumentDto
  ) {
    return this.documentsService.upload(file, uploadDocumentDto, req.user.id);
  }
} 