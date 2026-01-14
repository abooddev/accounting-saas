import { pgTable, uuid, varchar, decimal, date, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { moneyAccounts } from './money-accounts';

export const accountMovements = pgTable('account_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  accountId: uuid('account_id').references(() => moneyAccounts.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'in', 'out', 'transfer_in', 'transfer_out'
  amount: decimal('amount', { precision: 20, scale: 6 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 20, scale: 6 }).notNull(),
  referenceType: varchar('reference_type', { length: 50 }), // 'payment', 'receipt', 'transfer', 'adjustment', 'opening'
  referenceId: uuid('reference_id'),
  description: varchar('description', { length: 500 }),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  tenantAccountIdx: index('account_movements_tenant_account_idx').on(table.tenantId, table.accountId),
  tenantDateIdx: index('account_movements_tenant_date_idx').on(table.tenantId, table.date),
  referenceIdx: index('account_movements_reference_idx').on(table.referenceType, table.referenceId),
}));

export const accountMovementsRelations = relations(accountMovements, ({ one }) => ({
  tenant: one(tenants, {
    fields: [accountMovements.tenantId],
    references: [tenants.id],
  }),
  account: one(moneyAccounts, {
    fields: [accountMovements.accountId],
    references: [moneyAccounts.id],
  }),
}));

export type AccountMovement = typeof accountMovements.$inferSelect;
export type NewAccountMovement = typeof accountMovements.$inferInsert;
