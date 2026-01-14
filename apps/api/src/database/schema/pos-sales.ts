import { pgTable, uuid, varchar, decimal, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';
import { posSessions } from './pos-sessions';
import { contacts } from './contacts';

export const posSales = pgTable('pos_sales', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  sessionId: uuid('session_id').references(() => posSessions.id).notNull(),

  receiptNumber: varchar('receipt_number', { length: 50 }).notNull(),
  localId: varchar('local_id', { length: 50 }), // For offline sync

  customerId: uuid('customer_id').references(() => contacts.id),
  customerName: varchar('customer_name', { length: 255 }),

  subtotal: decimal('subtotal', { precision: 20, scale: 2 }).notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 2 }).default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).default('0'),
  total: decimal('total', { precision: 20, scale: 2 }).notNull(),

  currency: varchar('currency', { length: 3 }).notNull().default('USD').$type<'USD' | 'LBP'>(),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 2 }).notNull(),
  totalLBP: decimal('total_lbp', { precision: 20, scale: 2 }).notNull(),

  // Payment details stored as JSON
  payment: jsonb('payment').notNull().$type<{
    method: 'cash_usd' | 'cash_lbp' | 'card' | 'mixed';
    amountUSD: number;
    amountLBP: number;
    cashReceivedUSD: number;
    cashReceivedLBP: number;
    changeUSD: number;
    changeLBP: number;
  }>(),

  cashierId: uuid('cashier_id').references(() => users.id).notNull(),
  cashierName: varchar('cashier_name', { length: 255 }).notNull(),

  status: varchar('status', { length: 20 }).notNull().default('completed').$type<'completed' | 'voided' | 'returned'>(),
  voidReason: varchar('void_reason', { length: 500 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('pos_sales_tenant_idx').on(table.tenantId),
  sessionIdx: index('pos_sales_session_idx').on(table.sessionId),
  receiptIdx: index('pos_sales_receipt_idx').on(table.tenantId, table.receiptNumber),
  dateIdx: index('pos_sales_date_idx').on(table.tenantId, table.createdAt),
}));

export const posSaleItems = pgTable('pos_sale_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  saleId: uuid('sale_id').references(() => posSales.id).notNull(),

  productId: uuid('product_id').notNull(),
  barcode: varchar('barcode', { length: 100 }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  productNameAr: varchar('product_name_ar', { length: 255 }),

  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 20, scale: 2 }).notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  lineTotal: decimal('line_total', { precision: 20, scale: 2 }).notNull(),
}, (table) => ({
  saleIdx: index('pos_sale_items_sale_idx').on(table.saleId),
}));

export const posSalesRelations = relations(posSales, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [posSales.tenantId],
    references: [tenants.id],
  }),
  session: one(posSessions, {
    fields: [posSales.sessionId],
    references: [posSessions.id],
  }),
  customer: one(contacts, {
    fields: [posSales.customerId],
    references: [contacts.id],
  }),
  cashier: one(users, {
    fields: [posSales.cashierId],
    references: [users.id],
  }),
  items: many(posSaleItems),
}));

export const posSaleItemsRelations = relations(posSaleItems, ({ one }) => ({
  sale: one(posSales, {
    fields: [posSaleItems.saleId],
    references: [posSales.id],
  }),
}));

export type POSSale = typeof posSales.$inferSelect;
export type NewPOSSale = typeof posSales.$inferInsert;
export type POSSaleItem = typeof posSaleItems.$inferSelect;
export type NewPOSSaleItem = typeof posSaleItems.$inferInsert;
