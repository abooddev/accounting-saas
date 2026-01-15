import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { MatchingService } from './matching.service';
import { DatabaseModule } from '../../database/database.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [DatabaseModule, UploadModule],
  controllers: [OcrController],
  providers: [OcrService, MatchingService],
  exports: [OcrService, MatchingService],
})
export class OcrModule {}
