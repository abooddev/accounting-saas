import { pgTable, uuid, varchar, decimal, date, boolean, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';

export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  fromCurrency: varchar('from_currency', { length: 3 }).notNull().default('USD'),
  toCurrency: varchar('to_currency', { length: 3 }).notNull().default('LBP'),
  rate: decimal('rate', { precision: 20, scale: 6 }).notNull(),
  effectiveDate: date('effective_date').notNull(),
  source: varchar('source', { length: 50 }).default('manual'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueRate: unique().on(table.tenantId, table.fromCurrency, table.toCurrency, table.effectiveDate),
  tenantDateIdx: index('exchange_rates_tenant_date_idx').on(table.tenantId, table.effectiveDate),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [exchangeRates.tenantId],
    references: [tenants.id],
  }),
}));

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type NewExchangeRate = typeof exchangeRates.$inferInsert;
