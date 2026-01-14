import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PosModule } from './modules/pos/pos.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    ContactsModule,
    CategoriesModule,
    ProductsModule,
    ExchangeRatesModule,
    AccountsModule,
    InvoicesModule,
    PaymentsModule,
    DashboardModule,
    ReportsModule,
    PosModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('api/auth/register', 'api/auth/login', 'api/auth/refresh')
      .forRoutes('*');
  }
}
