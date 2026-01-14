import { Controller, Get, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('profit-loss')
  async getProfitLoss(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // Default to current month if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    return {
      success: true,
      data: await this.reportsService.getProfitLoss(tenantId, start, end),
    };
  }

  @Get('supplier-balances')
  async getSupplierBalances(@CurrentTenant() tenantId: string) {
    return {
      success: true,
      data: await this.reportsService.getSupplierBalances(tenantId),
    };
  }

  @Get('supplier-statement/:contactId')
  async getSupplierStatement(
    @CurrentTenant() tenantId: string,
    @Param('contactId') contactId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // Default to current month if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const result = await this.reportsService.getSupplierStatement(tenantId, contactId, start, end);

    if (!result) {
      throw new NotFoundException('Supplier not found');
    }

    return {
      success: true,
      data: result,
    };
  }

  @Get('supplier-history/:contactId')
  async getSupplierHistory(
    @CurrentTenant() tenantId: string,
    @Param('contactId') contactId: string,
    @Query('months') months?: string,
  ) {
    const result = await this.reportsService.getSupplierHistory(
      tenantId,
      contactId,
      months ? parseInt(months) : 12,
    );

    if (!result) {
      throw new NotFoundException('Supplier not found');
    }

    return {
      success: true,
      data: result,
    };
  }

  @Get('expenses-by-category')
  async getExpensesByCategory(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // Default to current month if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    return {
      success: true,
      data: await this.reportsService.getExpensesByCategory(tenantId, start, end),
    };
  }

  @Get('payments-due')
  async getPaymentsDue(@CurrentTenant() tenantId: string) {
    return {
      success: true,
      data: await this.reportsService.getPaymentsDue(tenantId),
    };
  }

  @Get('cash-flow')
  async getCashFlow(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // Default to current month if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    return {
      success: true,
      data: await this.reportsService.getCashFlow(tenantId, start, end),
    };
  }

  @Get('inventory-value')
  async getInventoryValue(@CurrentTenant() tenantId: string) {
    return {
      success: true,
      data: await this.reportsService.getInventoryValue(tenantId),
    };
  }

  @Get('low-stock')
  async getLowStock(@CurrentTenant() tenantId: string) {
    const result = await this.reportsService.getInventoryValue(tenantId);
    return {
      success: true,
      data: result.lowStock,
    };
  }
}
