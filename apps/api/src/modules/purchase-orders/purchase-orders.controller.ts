import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PurchaseOrdersService, PurchaseOrderWithItems } from './purchase-orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('supplierId') supplierId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<PurchaseOrderWithItems[]> {
    return this.purchaseOrdersService.findAll(tenantId, {
      status,
      supplierId,
      dateFrom,
      dateTo,
    });
  }

  @Get('stats')
  async getStats(@CurrentTenant() tenantId: string) {
    return this.purchaseOrdersService.getStats(tenantId);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<PurchaseOrderWithItems> {
    return this.purchaseOrdersService.findById(tenantId, id);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrderWithItems> {
    return this.purchaseOrdersService.create(tenantId, user.id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrderWithItems> {
    return this.purchaseOrdersService.update(tenantId, id, dto);
  }

  @Post(':id/status')
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled',
  ): Promise<PurchaseOrderWithItems> {
    return this.purchaseOrdersService.updateStatus(tenantId, id, status);
  }

  @Post(':id/receive')
  async receiveGoods(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: ReceiveGoodsDto,
  ): Promise<PurchaseOrderWithItems> {
    return this.purchaseOrdersService.receiveGoods(tenantId, id, dto.items);
  }

  @Post(':id/convert-to-invoice')
  async convertToInvoice(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.purchaseOrdersService.convertToInvoice(tenantId, id, user.id);
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.purchaseOrdersService.delete(tenantId, id);
    return { message: 'Purchase order deleted successfully' };
  }
}
