import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreditNotesService, CreditNoteWithDetails } from './credit-notes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';
import { ApplyCreditNoteDto } from './dto/apply-credit-note.dto';

@Controller('credit-notes')
@UseGuards(JwtAuthGuard)
export class CreditNotesController {
  constructor(private readonly creditNotesService: CreditNotesService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('type') type?: 'credit' | 'debit',
    @Query('status') status?: 'draft' | 'issued' | 'applied' | 'cancelled',
    @Query('contactId') contactId?: string,
    @Query('contactType') contactType?: 'customer' | 'supplier',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<CreditNoteWithDetails[]> {
    return this.creditNotesService.findAll(tenantId, {
      type,
      status,
      contactId,
      contactType,
      dateFrom,
      dateTo,
    });
  }

  @Get('stats')
  async getStats(@CurrentTenant() tenantId: string) {
    return this.creditNotesService.getStats(tenantId);
  }

  @Get('unapplied/:contactId')
  async getUnappliedCredits(
    @CurrentTenant() tenantId: string,
    @Param('contactId') contactId: string,
  ): Promise<CreditNoteWithDetails[]> {
    return this.creditNotesService.getUnappliedCredits(tenantId, contactId);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<CreditNoteWithDetails> {
    return this.creditNotesService.findById(tenantId, id);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCreditNoteDto,
  ): Promise<CreditNoteWithDetails> {
    return this.creditNotesService.create(tenantId, user.id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCreditNoteDto,
  ): Promise<CreditNoteWithDetails> {
    return this.creditNotesService.update(tenantId, id, dto);
  }

  @Post(':id/issue')
  async issue(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<CreditNoteWithDetails> {
    return this.creditNotesService.issue(tenantId, id);
  }

  @Post(':id/apply')
  async applyToInvoice(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ApplyCreditNoteDto,
  ): Promise<CreditNoteWithDetails> {
    return this.creditNotesService.applyToInvoice(
      tenantId,
      id,
      dto.invoiceId,
      dto.amount,
      user.id,
      dto.notes,
    );
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<CreditNoteWithDetails> {
    return this.creditNotesService.cancel(tenantId, id, reason);
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.creditNotesService.delete(tenantId, id);
    return { message: 'Credit/Debit note deleted successfully' };
  }
}
