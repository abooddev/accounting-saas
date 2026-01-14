import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentsService, PaymentWithRelations } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('type') type?: string,
    @Query('contactId') contactId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<PaymentWithRelations[]> {
    return this.paymentsService.findAll(tenantId, {
      type,
      contactId,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<PaymentWithRelations> {
    return this.paymentsService.findById(tenantId, id);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePaymentDto,
  ): Promise<PaymentWithRelations> {
    return this.paymentsService.create(tenantId, user.id, dto);
  }

  @Delete(':id')
  async void(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.paymentsService.void(tenantId, id);
    return { message: 'Payment voided successfully' };
  }
}
