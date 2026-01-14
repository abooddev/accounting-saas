import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InvoicesService, InvoiceWithItems } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('contactId') contactId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<InvoiceWithItems[]> {
    return this.invoicesService.findAll(tenantId, {
      type,
      status,
      contactId,
      dateFrom,
      dateTo,
    });
  }

  @Get('stats')
  async getStats(@CurrentTenant() tenantId: string) {
    return this.invoicesService.getStats(tenantId);
  }

  @Get('due-soon')
  async getDueSoon(
    @CurrentTenant() tenantId: string,
    @Query('days') days?: string,
  ) {
    return this.invoicesService.getDueSoon(tenantId, days ? parseInt(days) : 7);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<InvoiceWithItems> {
    return this.invoicesService.findById(tenantId, id);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateInvoiceDto,
  ): Promise<InvoiceWithItems> {
    return this.invoicesService.create(tenantId, user.id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ): Promise<InvoiceWithItems> {
    return this.invoicesService.update(tenantId, id, dto);
  }

  @Post(':id/confirm')
  async confirm(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<InvoiceWithItems> {
    return this.invoicesService.confirm(tenantId, id);
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<InvoiceWithItems> {
    return this.invoicesService.cancel(tenantId, id);
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.invoicesService.delete(tenantId, id);
    return { message: 'Invoice deleted successfully' };
  }
}
