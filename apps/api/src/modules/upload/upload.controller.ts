import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.uploadService.saveImage(tenantId, file);
  }

  @Get(':tenantId/:filename')
  async getFile(
    @Param('tenantId') tenantId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const relativePath = `${tenantId}/${filename}`;
    const filePath = this.uploadService.getFilePath(relativePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const mimeType = this.uploadService.getMimeType(relativePath);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(filePath, { root: '.' });
  }
}
