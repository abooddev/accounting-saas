import { pgTable, uuid, varchar, decimal, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';

export const moneyAccounts = pgTable('money_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  nameAr: varchar('name_ar', { length: 255 }),
  type: varchar('type', { length: 20 }).notNull(), // 'cash', 'bank'
  currency: varchar('currency', { length: 3 }).notNull(), // 'USD', 'LBP'
  currentBalance: decimal('current_balance', { precision: 20, scale: 6 }).default('0'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  tenantCurrencyIdx: index('money_accounts_tenant_currency_idx').on(table.tenantId, table.currency),
  tenantTypeIdx: index('money_accounts_tenant_type_idx').on(table.tenantId, table.type),
}));

export const moneyAccountsRelations = relations(moneyAccounts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [moneyAccounts.tenantId],
    references: [tenants.id],
  }),
}));

export type MoneyAccount = typeof moneyAccounts.$inferSelect;
export type NewMoneyAccount = typeof moneyAccounts.$inferInsert;
