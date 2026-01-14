import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PosService, OpenSessionDto, CloseSessionDto, CreateSaleDto } from './pos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('pos')
@UseGuards(JwtAuthGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  // Session endpoints
  @Post('sessions/open')
  async openSession(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: OpenSessionDto,
  ) {
    return this.posService.openSession(tenantId, user.id, user.name, dto);
  }

  @Post('sessions/:id/close')
  async closeSession(
    @CurrentTenant() tenantId: string,
    @Param('id') sessionId: string,
    @Body() dto: CloseSessionDto,
  ) {
    return this.posService.closeSession(tenantId, sessionId, dto);
  }

  @Get('sessions/active')
  async getActiveSession(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.posService.getActiveSession(tenantId, user.id);
  }

  @Get('sessions/:id')
  async getSession(
    @CurrentTenant() tenantId: string,
    @Param('id') sessionId: string,
  ) {
    return this.posService.getSession(tenantId, sessionId);
  }

  @Get('sessions')
  async getSessions(
    @CurrentTenant() tenantId: string,
    @Query('limit') limit?: string,
  ) {
    return this.posService.getSessions(tenantId, limit ? parseInt(limit, 10) : undefined);
  }

  // Sales endpoints
  @Post('sales')
  async createSale(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSaleDto,
  ) {
    return this.posService.createSale(tenantId, user.id, user.name, dto);
  }

  @Get('sales')
  async getSales(
    @CurrentTenant() tenantId: string,
    @Query('sessionId') sessionId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.posService.getSales(tenantId, sessionId, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('sales/:id')
  async getSale(
    @CurrentTenant() tenantId: string,
    @Param('id') saleId: string,
  ) {
    return this.posService.getSale(tenantId, saleId);
  }
}
