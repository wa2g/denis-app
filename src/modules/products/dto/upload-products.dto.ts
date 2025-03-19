import { ApiProperty } from '@nestjs/swagger';

export class UploadProductsDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Excel file containing product data'
  })
  file: Express.Multer.File;
} 