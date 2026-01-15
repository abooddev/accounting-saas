import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { QuotesService, QuoteWithItems } from './quotes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { RejectQuoteDto } from './dto/reject-quote.dto';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<QuoteWithItems[]> {
    return this.quotesService.findAll(tenantId, {
      status,
      customerId,
      dateFrom,
      dateTo,
    });
  }

  @Get('stats')
  async getStats(@CurrentTenant() tenantId: string) {
    return this.quotesService.getStats(tenantId);
  }

  @Get('expiring-soon')
  async getExpiringSoon(
    @CurrentTenant() tenantId: string,
    @Query('days') days?: string,
  ) {
    return this.quotesService.getExpiringSoon(tenantId, days ? parseInt(days) : 7);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<QuoteWithItems> {
    return this.quotesService.findById(tenantId, id);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateQuoteDto,
  ): Promise<QuoteWithItems> {
    return this.quotesService.create(tenantId, user.id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
  ): Promise<QuoteWithItems> {
    return this.quotesService.update(tenantId, id, dto);
  }

  @Post(':id/send')
  async send(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<QuoteWithItems> {
    return this.quotesService.send(tenantId, id);
  }

  @Post(':id/accept')
  async accept(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<QuoteWithItems> {
    return this.quotesService.accept(tenantId, id);
  }

  @Post(':id/reject')
  async reject(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectQuoteDto,
  ): Promise<QuoteWithItems> {
    return this.quotesService.reject(tenantId, id, dto.reason);
  }

  @Post(':id/convert-to-sales-order')
  async convertToSalesOrder(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<{ salesOrderId: string }> {
    return this.quotesService.convertToSalesOrder(tenantId, id, user.id);
  }

  @Post(':id/convert-to-invoice')
  async convertToInvoice(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<{ invoiceId: string }> {
    return this.quotesService.convertToInvoice(tenantId, id, user.id);
  }

  @Post(':id/duplicate')
  async duplicate(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<QuoteWithItems> {
    return this.quotesService.duplicate(tenantId, id, user.id);
  }

  @Post('check-expired')
  async checkExpired() {
    return this.quotesService.checkExpired();
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.quotesService.delete(tenantId, id);
    return { message: 'Quote deleted successfully' };
  }
}
