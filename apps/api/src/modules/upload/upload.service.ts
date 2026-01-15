import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  path: string;
  filename: string;
  url: string;
}

@Injectable()
export class UploadService {
  private uploadDir: string;
  private maxFileSize: number;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE') || 10 * 1024 * 1024; // 10MB
  }

  async saveImage(
    tenantId: string,
    file: Express.Multer.File,
  ): Promise<UploadResult> {
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum allowed (${this.maxFileSize / 1024 / 1024}MB)`);
    }

    // Create tenant directory if it doesn't exist
    const tenantDir = path.join(this.uploadDir, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(file.originalname) || this.getExtensionFromMime(file.mimetype);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(tenantDir, filename);

    // Write file
    fs.writeFileSync(filePath, file.buffer);

    // Return relative path for storage and URL for access
    const relativePath = path.join(tenantId, filename);

    return {
      path: relativePath,
      filename,
      url: `/uploads/${relativePath}`,
    };
  }

  getFilePath(relativePath: string): string {
    return path.join(this.uploadDir, relativePath);
  }

  async readFileAsBase64(relativePath: string): Promise<string> {
    const filePath = this.getFilePath(relativePath);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  }

  async readFileAsBuffer(relativePath: string): Promise<Buffer> {
    const filePath = this.getFilePath(relativePath);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }
    return fs.readFileSync(filePath);
  }

  getMimeType(relativePath: string): string {
    const ext = path.extname(relativePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private getExtensionFromMime(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return extensions[mimeType] || '.bin';
  }

  async deleteFile(relativePath: string): Promise<void> {
    const filePath = this.getFilePath(relativePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
