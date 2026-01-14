import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getSummary(tenantId);
  }

  @Get('payables')
  async getPayables(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getPayables(tenantId);
  }

  @Get('recent')
  async getRecent(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getRecent(tenantId);
  }

  @Get('due-this-week')
  async getDueThisWeek(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getDueThisWeek(tenantId);
  }
}
