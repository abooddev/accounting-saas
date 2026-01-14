import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';

@Controller('exchange-rates')
@UseGuards(JwtAuthGuard)
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.exchangeRatesService.findAll(tenantId);
  }

  @Get('current')
  async getCurrent(@CurrentTenant() tenantId: string) {
    const rate = await this.exchangeRatesService.getCurrentRate(tenantId);
    return { rate, fromCurrency: 'USD', toCurrency: 'LBP' };
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateExchangeRateDto,
  ) {
    return this.exchangeRatesService.create(tenantId, dto);
  }
}
