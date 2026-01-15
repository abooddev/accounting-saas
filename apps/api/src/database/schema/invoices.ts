import { pgTable, uuid, varchar, decimal, date, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { contacts } from './contacts';
import { users } from './users';

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'purchase', 'expense', 'sale'
  invoiceNumber: varchar('invoice_number', { length: 100 }), // Supplier's invoice number
  internalNumber: varchar('internal_number', { length: 50 }).notNull(), // PUR-2024-00001
  contactId: uuid('contact_id').references(() => contacts.id),
  date: date('date').notNull(),
  dueDate: date('due_date'),
  status: varchar('status', { length: 20 }).default('pending'), // 'draft', 'pending', 'partial', 'paid', 'cancelled'
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 6 }).notNull(),
  subtotal: decimal('subtotal', { precision: 20, scale: 6 }).notNull().default('0'),
  discountType: varchar('discount_type', { length: 10 }), // 'percent', 'fixed'
  discountValue: decimal('discount_value', { precision: 20, scale: 6 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 6 }).default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 6 }).default('0'),
  total: decimal('total', { precision: 20, scale: 6 }).notNull().default('0'),
  totalLbp: decimal('total_lbp', { precision: 20, scale: 6 }).notNull().default('0'),
  amountPaid: decimal('amount_paid', { precision: 20, scale: 6 }).default('0'),
  balance: decimal('balance', { precision: 20, scale: 6 }).default('0'),
  notes: text('notes'),
  expenseCategory: varchar('expense_category', { length: 100 }),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  tenantTypeIdx: index('invoices_tenant_type_idx').on(table.tenantId, table.type),
  tenantContactIdx: index('invoices_tenant_contact_idx').on(table.tenantId, table.contactId),
  tenantStatusIdx: index('invoices_tenant_status_idx').on(table.tenantId, table.status),
  tenantDateIdx: index('invoices_tenant_date_idx').on(table.tenantId, table.date),
  tenantDueDateIdx: index('invoices_tenant_due_date_idx').on(table.tenantId, table.dueDate),
  tenantInternalNumberIdx: index('invoices_tenant_internal_number_idx').on(table.tenantId, table.internalNumber),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
  contact: one(contacts, {
    fields: [invoices.contactId],
    references: [contacts.id],
  }),
  createdByUser: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id'),
  description: varchar('description', { length: 500 }).notNull(),
  quantity: decimal('quantity', { precision: 20, scale: 6 }).notNull().default('1'), // Total pieces
  boxQty: decimal('box_qty', { precision: 20, scale: 6 }), // Number of boxes/cartons
  piecesPerBox: decimal('pieces_per_box', { precision: 20, scale: 6 }), // Pieces per box
  unit: varchar('unit', { length: 20 }).default('piece'),
  unitPrice: decimal('unit_price', { precision: 20, scale: 6 }).notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  lineTotal: decimal('line_total', { precision: 20, scale: 6 }).notNull(),
  sortOrder: decimal('sort_order').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  invoiceIdx: index('invoice_items_invoice_idx').on(table.invoiceId),
  productIdx: index('invoice_items_product_idx').on(table.productId),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
