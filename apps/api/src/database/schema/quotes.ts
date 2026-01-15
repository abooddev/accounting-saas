import { pgTable, uuid, varchar, decimal, date, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { contacts } from './contacts';
import { users } from './users';
import { products } from './products';

export const quotes = pgTable('quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  number: varchar('number', { length: 50 }).notNull(), // QUO-2024-00001
  customerId: uuid('customer_id').references(() => contacts.id).notNull(),
  date: date('date').notNull(),
  validUntil: date('valid_until').notNull(),
  status: varchar('status', { length: 20 }).default('draft').notNull().$type<'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'>(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 6 }).notNull(),
  subtotal: decimal('subtotal', { precision: 20, scale: 6 }).notNull().default('0'),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 6 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 6 }).default('0'),
  total: decimal('total', { precision: 20, scale: 6 }).notNull().default('0'),
  terms: text('terms'),
  notes: text('notes'),
  rejectionReason: text('rejection_reason'),
  convertedToType: varchar('converted_to_type', { length: 20 }), // 'sales_order' | 'invoice'
  convertedToId: uuid('converted_to_id'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  tenantIdx: index('quotes_tenant_idx').on(table.tenantId),
  tenantStatusIdx: index('quotes_tenant_status_idx').on(table.tenantId, table.status),
  tenantCustomerIdx: index('quotes_tenant_customer_idx').on(table.tenantId, table.customerId),
  tenantDateIdx: index('quotes_tenant_date_idx').on(table.tenantId, table.date),
  tenantNumberIdx: index('quotes_tenant_number_idx').on(table.tenantId, table.number),
  tenantValidUntilIdx: index('quotes_tenant_valid_until_idx').on(table.tenantId, table.validUntil),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [quotes.tenantId],
    references: [tenants.id],
  }),
  customer: one(contacts, {
    fields: [quotes.customerId],
    references: [contacts.id],
  }),
  createdByUser: one(users, {
    fields: [quotes.createdBy],
    references: [users.id],
  }),
  items: many(quoteItems),
}));

export const quoteItems = pgTable('quote_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteId: uuid('quote_id').references(() => quotes.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id),
  description: varchar('description', { length: 500 }).notNull(),
  quantity: decimal('quantity', { precision: 20, scale: 6 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 20, scale: 6 }).notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  lineTotal: decimal('line_total', { precision: 20, scale: 6 }).notNull(),
  sortOrder: decimal('sort_order').default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  quoteIdx: index('quote_items_quote_idx').on(table.quoteId),
  productIdx: index('quote_items_product_idx').on(table.productId),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
  product: one(products, {
    fields: [quoteItems.productId],
    references: [products.id],
  }),
}));

export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type NewQuoteItem = typeof quoteItems.$inferInsert;
