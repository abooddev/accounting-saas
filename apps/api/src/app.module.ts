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
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { SalesOrdersModule } from './modules/sales-orders/sales-orders.module';
import { PriceListsModule } from './modules/price-lists/price-lists.module';
import { CreditNotesModule } from './modules/credit-notes/credit-notes.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { UploadModule } from './modules/upload/upload.module';
import { OcrModule } from './modules/ocr/ocr.module';
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
    PurchaseOrdersModule,
    SalesOrdersModule,
    PriceListsModule,
    CreditNotesModule,
    QuotesModule,
    UploadModule,
    OcrModule,
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
