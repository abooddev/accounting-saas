import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SalesOrdersService, SalesOrderWithItems } from './sales-orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { DeliverSalesOrderDto } from './dto/deliver-sales-order.dto';

@Controller('sales-orders')
@UseGuards(JwtAuthGuard)
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('salesRepId') salesRepId?: string,
  ): Promise<SalesOrderWithItems[]> {
    return this.salesOrdersService.findAll(tenantId, {
      status,
      customerId,
      dateFrom,
      dateTo,
      salesRepId,
    });
  }

  @Get('stats')
  async getStats(@CurrentTenant() tenantId: string) {
    return this.salesOrdersService.getStats(tenantId);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<SalesOrderWithItems> {
    return this.salesOrdersService.findById(tenantId, id);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSalesOrderDto,
  ): Promise<SalesOrderWithItems> {
    return this.salesOrdersService.create(tenantId, user.id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderDto,
  ): Promise<SalesOrderWithItems> {
    return this.salesOrdersService.update(tenantId, id, dto);
  }

  @Post(':id/confirm')
  async confirm(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<SalesOrderWithItems> {
    return this.salesOrdersService.confirm(tenantId, id);
  }

  @Post(':id/deliver')
  async deliver(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: DeliverSalesOrderDto,
  ): Promise<SalesOrderWithItems> {
    return this.salesOrdersService.deliver(tenantId, id, dto.items);
  }

  @Post(':id/convert-to-invoice')
  async convertToInvoice(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<{ invoiceId: string }> {
    return this.salesOrdersService.convertToInvoice(tenantId, id, user.id);
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<SalesOrderWithItems> {
    return this.salesOrdersService.cancel(tenantId, id);
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.salesOrdersService.delete(tenantId, id);
    return { message: 'Sales order deleted successfully' };
  }
}
