import { pgTable, uuid, varchar, decimal, date, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { contacts } from './contacts';
import { users } from './users';
import { products } from './products';

export const salesOrders = pgTable('sales_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  number: varchar('number', { length: 50 }).notNull(), // SO-2024-00001
  customerId: uuid('customer_id').references(() => contacts.id).notNull(),
  date: date('date').notNull(),
  expectedDeliveryDate: date('expected_delivery_date'),
  status: varchar('status', { length: 20 }).default('draft').notNull().$type<'draft' | 'confirmed' | 'partial' | 'fulfilled' | 'cancelled'>(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 6 }).notNull(),
  subtotal: decimal('subtotal', { precision: 20, scale: 6 }).notNull().default('0'),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 6 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 6 }).default('0'),
  total: decimal('total', { precision: 20, scale: 6 }).notNull().default('0'),
  priceListId: uuid('price_list_id'), // nullable, for future price list feature
  salesRepId: uuid('sales_rep_id').references(() => users.id), // nullable
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  tenantIdx: index('sales_orders_tenant_idx').on(table.tenantId),
  tenantStatusIdx: index('sales_orders_tenant_status_idx').on(table.tenantId, table.status),
  tenantCustomerIdx: index('sales_orders_tenant_customer_idx').on(table.tenantId, table.customerId),
  tenantDateIdx: index('sales_orders_tenant_date_idx').on(table.tenantId, table.date),
  tenantNumberIdx: index('sales_orders_tenant_number_idx').on(table.tenantId, table.number),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [salesOrders.tenantId],
    references: [tenants.id],
  }),
  customer: one(contacts, {
    fields: [salesOrders.customerId],
    references: [contacts.id],
  }),
  salesRep: one(users, {
    fields: [salesOrders.salesRepId],
    references: [users.id],
    relationName: 'salesRep',
  }),
  createdByUser: one(users, {
    fields: [salesOrders.createdBy],
    references: [users.id],
    relationName: 'createdBy',
  }),
  items: many(salesOrderItems),
}));

export const salesOrderItems = pgTable('sales_order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  salesOrderId: uuid('sales_order_id').references(() => salesOrders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  quantityOrdered: decimal('quantity_ordered', { precision: 20, scale: 6 }).notNull(),
  quantityDelivered: decimal('quantity_delivered', { precision: 20, scale: 6 }).notNull().default('0'),
  unitPrice: decimal('unit_price', { precision: 20, scale: 6 }).notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  lineTotal: decimal('line_total', { precision: 20, scale: 6 }).notNull(),
  sortOrder: decimal('sort_order').default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  salesOrderIdx: index('sales_order_items_sales_order_idx').on(table.salesOrderId),
  productIdx: index('sales_order_items_product_idx').on(table.productId),
}));

export const salesOrderItemsRelations = relations(salesOrderItems, ({ one }) => ({
  salesOrder: one(salesOrders, {
    fields: [salesOrderItems.salesOrderId],
    references: [salesOrders.id],
  }),
  product: one(products, {
    fields: [salesOrderItems.productId],
    references: [products.id],
  }),
}));

export type SalesOrder = typeof salesOrders.$inferSelect;
export type NewSalesOrder = typeof salesOrders.$inferInsert;
export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type NewSalesOrderItem = typeof salesOrderItems.$inferInsert;
