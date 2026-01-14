import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { TransferDto } from './dto/transfer.dto';
import { AdjustmentDto } from './dto/adjustment.dto';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.accountsService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.accountsService.findById(tenantId, id);
  }

  @Get(':id/movements')
  async getMovements(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.accountsService.getMovements(tenantId, id, limit ? parseInt(limit) : 50);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateAccountDto,
  ) {
    return this.accountsService.create(tenantId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.accountsService.delete(tenantId, id);
    return { message: 'Account deleted successfully' };
  }

  @Post('transfer')
  async transfer(
    @CurrentTenant() tenantId: string,
    @Body() dto: TransferDto,
  ) {
    return this.accountsService.transfer(tenantId, dto);
  }

  @Post(':id/adjust')
  async adjust(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: AdjustmentDto,
  ) {
    return this.accountsService.adjust(tenantId, id, dto);
  }
}
