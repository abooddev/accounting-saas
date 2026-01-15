import { pgTable, uuid, varchar, decimal, date, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { contacts } from './contacts';
import { users } from './users';
import { products } from './products';

export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  number: varchar('number', { length: 50 }).notNull(), // PO-2024-00001
  supplierId: uuid('supplier_id').references(() => contacts.id),
  date: date('date').notNull(),
  expectedDeliveryDate: date('expected_delivery_date'),
  status: varchar('status', { length: 20 }).default('draft').notNull().$type<'draft' | 'sent' | 'partial' | 'received' | 'cancelled'>(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 6 }).notNull(),
  subtotal: decimal('subtotal', { precision: 20, scale: 6 }).notNull().default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 6 }).default('0'),
  total: decimal('total', { precision: 20, scale: 6 }).notNull().default('0'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  tenantIdx: index('purchase_orders_tenant_idx').on(table.tenantId),
  tenantSupplierIdx: index('purchase_orders_tenant_supplier_idx').on(table.tenantId, table.supplierId),
  tenantStatusIdx: index('purchase_orders_tenant_status_idx').on(table.tenantId, table.status),
  tenantDateIdx: index('purchase_orders_tenant_date_idx').on(table.tenantId, table.date),
  tenantNumberIdx: index('purchase_orders_tenant_number_idx').on(table.tenantId, table.number),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [purchaseOrders.tenantId],
    references: [tenants.id],
  }),
  supplier: one(contacts, {
    fields: [purchaseOrders.supplierId],
    references: [contacts.id],
  }),
  createdByUser: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id),
  description: varchar('description', { length: 500 }).notNull(),
  quantityOrdered: decimal('quantity_ordered', { precision: 20, scale: 6 }).notNull().default('1'),
  quantityReceived: decimal('quantity_received', { precision: 20, scale: 6 }).notNull().default('0'),
  unitPrice: decimal('unit_price', { precision: 20, scale: 6 }).notNull(),
  lineTotal: decimal('line_total', { precision: 20, scale: 6 }).notNull(),
  sortOrder: decimal('sort_order').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  purchaseOrderIdx: index('purchase_order_items_po_idx').on(table.purchaseOrderId),
  productIdx: index('purchase_order_items_product_idx').on(table.productId),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}));

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
