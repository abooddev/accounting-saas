import { pgTable, uuid, varchar, decimal, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';

export const posSessions = pgTable('pos_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  terminalId: varchar('terminal_id', { length: 50 }).notNull(),
  terminalCode: varchar('terminal_code', { length: 20 }).notNull(),

  cashierId: uuid('cashier_id').references(() => users.id).notNull(),
  cashierName: varchar('cashier_name', { length: 255 }).notNull(),

  openedAt: timestamp('opened_at').notNull(),
  closedAt: timestamp('closed_at'),

  openingCashUSD: decimal('opening_cash_usd', { precision: 20, scale: 2 }).notNull().default('0'),
  openingCashLBP: decimal('opening_cash_lbp', { precision: 20, scale: 2 }).notNull().default('0'),

  closingCashUSD: decimal('closing_cash_usd', { precision: 20, scale: 2 }),
  closingCashLBP: decimal('closing_cash_lbp', { precision: 20, scale: 2 }),

  expectedCashUSD: decimal('expected_cash_usd', { precision: 20, scale: 2 }).notNull().default('0'),
  expectedCashLBP: decimal('expected_cash_lbp', { precision: 20, scale: 2 }).notNull().default('0'),

  differenceUSD: decimal('difference_usd', { precision: 20, scale: 2 }),
  differenceLBP: decimal('difference_lbp', { precision: 20, scale: 2 }),

  totalSales: decimal('total_sales', { precision: 20, scale: 2 }).notNull().default('0'),
  totalReturns: decimal('total_returns', { precision: 20, scale: 2 }).notNull().default('0'),
  totalTransactions: decimal('total_transactions', { precision: 10, scale: 0 }).notNull().default('0'),

  status: varchar('status', { length: 20 }).notNull().default('open').$type<'open' | 'closed'>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('pos_sessions_tenant_idx').on(table.tenantId),
  tenantStatusIdx: index('pos_sessions_tenant_status_idx').on(table.tenantId, table.status),
  cashierIdx: index('pos_sessions_cashier_idx').on(table.cashierId),
}));

export const posSessionsRelations = relations(posSessions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [posSessions.tenantId],
    references: [tenants.id],
  }),
  cashier: one(users, {
    fields: [posSessions.cashierId],
    references: [users.id],
  }),
}));

export type POSSession = typeof posSessions.$inferSelect;
export type NewPOSSession = typeof posSessions.$inferInsert;
