import { pgTable, uuid, varchar, text, integer, decimal, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  type: varchar('type', { length: 20 }).notNull().$type<'supplier' | 'customer' | 'both'>(),
  name: varchar('name', { length: 255 }).notNull(),
  nameAr: varchar('name_ar', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  taxNumber: varchar('tax_number', { length: 100 }),
  paymentTermsDays: integer('payment_terms_days').default(0).notNull(),
  creditLimit: decimal('credit_limit', { precision: 20, scale: 6 }).default('0').notNull(),
  balanceUsd: decimal('balance_usd', { precision: 20, scale: 6 }).default('0').notNull(),
  balanceLbp: decimal('balance_lbp', { precision: 20, scale: 6 }).default('0').notNull(),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  tenantTypeIdx: index('contacts_tenant_type_idx').on(table.tenantId, table.type),
  tenantNameIdx: index('contacts_tenant_name_idx').on(table.tenantId, table.name),
}));

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
