import { pgTable, uuid, varchar, integer, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';

export const sequences = pgTable('sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'purchase_invoice', 'expense_invoice', 'sale_invoice', 'payment'
  prefix: varchar('prefix', { length: 20 }).notNull(), // 'PUR', 'EXP', 'SAL', 'PAY'
  currentNumber: integer('current_number').default(0),
  year: integer('year').notNull(),
  format: varchar('format', { length: 50 }).default('{prefix}-{year}-{number:05d}'),
}, (table) => ({
  uniqueSequence: unique().on(table.tenantId, table.type, table.year),
}));

export const sequencesRelations = relations(sequences, ({ one }) => ({
  tenant: one(tenants, {
    fields: [sequences.tenantId],
    references: [tenants.id],
  }),
}));

export type Sequence = typeof sequences.$inferSelect;
export type NewSequence = typeof sequences.$inferInsert;
