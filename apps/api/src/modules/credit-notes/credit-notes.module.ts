import { Module } from '@nestjs/common';
import { CreditNotesController } from './credit-notes.controller';
import { CreditNotesService } from './credit-notes.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CreditNotesController],
  providers: [CreditNotesService],
  exports: [CreditNotesService],
})
export class CreditNotesModule {}
