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
import { PriceListsService } from './price-lists.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { AddPriceListItemsDto, UpdatePriceListItemDto } from './dto/price-list-item.dto';
import { AssignCustomerPriceListDto } from './dto/customer-price-list.dto';

@Controller('price-lists')
@UseGuards(JwtAuthGuard)
export class PriceListsController {
  constructor(private readonly priceListsService: PriceListsService) {}

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreatePriceListDto,
  ) {
    return this.priceListsService.create(tenantId, dto);
  }

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.priceListsService.findAll(tenantId);
  }

  @Get('default')
  async getDefault(@CurrentTenant() tenantId: string) {
    return this.priceListsService.getDefaultPriceList(tenantId);
  }

  @Get('product-price/:productId')
  async getProductPrice(
    @CurrentTenant() tenantId: string,
    @Param('productId') productId: string,
    @Query('customerId') customerId?: string,
    @Query('quantity') quantity?: string,
  ) {
    const qty = quantity ? parseInt(quantity, 10) : undefined;
    return this.priceListsService.getProductPrice(tenantId, productId, customerId, qty);
  }

  @Get('customer/:customerId')
  async getCustomerPriceLists(
    @CurrentTenant() tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.priceListsService.getCustomerPriceLists(tenantId, customerId);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.priceListsService.findById(tenantId, id);
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePriceListDto,
  ) {
    return this.priceListsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.priceListsService.delete(tenantId, id);
    return { message: 'Price list deleted successfully' };
  }

  @Post(':id/items')
  async addItems(
    @CurrentTenant() tenantId: string,
    @Param('id') priceListId: string,
    @Body() dto: AddPriceListItemsDto,
  ) {
    return this.priceListsService.addItems(tenantId, priceListId, dto.items);
  }

  @Patch('items/:itemId')
  async updateItem(
    @CurrentTenant() tenantId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePriceListItemDto,
  ) {
    return this.priceListsService.updateItem(tenantId, itemId, dto);
  }

  @Delete('items/:itemId')
  async removeItem(
    @CurrentTenant() tenantId: string,
    @Param('itemId') itemId: string,
  ) {
    await this.priceListsService.removeItem(tenantId, itemId);
    return { message: 'Item removed from price list successfully' };
  }

  @Post('assign-customer')
  async assignToCustomer(
    @CurrentTenant() tenantId: string,
    @Body() dto: AssignCustomerPriceListDto,
  ) {
    return this.priceListsService.assignToCustomer(
      tenantId,
      dto.customerId,
      dto.priceListId,
      dto.priority,
    );
  }

  @Delete('customer/:customerId/price-list/:priceListId')
  async removeCustomerAssignment(
    @CurrentTenant() tenantId: string,
    @Param('customerId') customerId: string,
    @Param('priceListId') priceListId: string,
  ) {
    await this.priceListsService.removeCustomerAssignment(tenantId, customerId, priceListId);
    return { message: 'Customer assignment removed successfully' };
  }
}
