import { pgTable, uuid, varchar, decimal, date, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { contacts } from './contacts';
import { users } from './users';
import { invoices } from './invoices';
import { products } from './products';

export const creditNotes = pgTable('credit_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  number: varchar('number', { length: 50 }).notNull(), // CN-2024-00001 or DN-2024-00001
  type: varchar('type', { length: 10 }).notNull().$type<'credit' | 'debit'>(), // credit or debit
  contactId: uuid('contact_id').references(() => contacts.id).notNull(),
  contactType: varchar('contact_type', { length: 20 }).notNull().$type<'customer' | 'supplier'>(), // customer or supplier
  originalInvoiceId: uuid('original_invoice_id').references(() => invoices.id),
  date: date('date').notNull(),
  reason: text('reason'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 6 }).notNull(),
  subtotal: decimal('subtotal', { precision: 20, scale: 6 }).notNull().default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 6 }).default('0'),
  total: decimal('total', { precision: 20, scale: 6 }).notNull().default('0'),
  totalLbp: decimal('total_lbp', { precision: 20, scale: 6 }).notNull().default('0'),
  status: varchar('status', { length: 20 }).default('draft').$type<'draft' | 'issued' | 'applied' | 'cancelled'>(),
  appliedAmount: decimal('applied_amount', { precision: 20, scale: 6 }).default('0'),
  unappliedAmount: decimal('unapplied_amount', { precision: 20, scale: 6 }).default('0'),
  notes: text('notes'),
  cancellationReason: text('cancellation_reason'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  tenantTypeIdx: index('credit_notes_tenant_type_idx').on(table.tenantId, table.type),
  tenantContactIdx: index('credit_notes_tenant_contact_idx').on(table.tenantId, table.contactId),
  tenantStatusIdx: index('credit_notes_tenant_status_idx').on(table.tenantId, table.status),
  tenantDateIdx: index('credit_notes_tenant_date_idx').on(table.tenantId, table.date),
  tenantNumberIdx: index('credit_notes_tenant_number_idx').on(table.tenantId, table.number),
}));

export const creditNotesRelations = relations(creditNotes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [creditNotes.tenantId],
    references: [tenants.id],
  }),
  contact: one(contacts, {
    fields: [creditNotes.contactId],
    references: [contacts.id],
  }),
  originalInvoice: one(invoices, {
    fields: [creditNotes.originalInvoiceId],
    references: [invoices.id],
  }),
  createdByUser: one(users, {
    fields: [creditNotes.createdBy],
    references: [users.id],
  }),
  items: many(creditNoteItems),
  allocations: many(creditNoteAllocations),
}));

export const creditNoteItems = pgTable('credit_note_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  creditNoteId: uuid('credit_note_id').references(() => creditNotes.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id),
  description: varchar('description', { length: 500 }).notNull(),
  quantity: decimal('quantity', { precision: 20, scale: 6 }).notNull().default('1'),
  unitPrice: decimal('unit_price', { precision: 20, scale: 6 }).notNull(),
  lineTotal: decimal('line_total', { precision: 20, scale: 6 }).notNull(),
  sortOrder: decimal('sort_order').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  creditNoteIdx: index('credit_note_items_credit_note_idx').on(table.creditNoteId),
  productIdx: index('credit_note_items_product_idx').on(table.productId),
}));

export const creditNoteItemsRelations = relations(creditNoteItems, ({ one }) => ({
  creditNote: one(creditNotes, {
    fields: [creditNoteItems.creditNoteId],
    references: [creditNotes.id],
  }),
  product: one(products, {
    fields: [creditNoteItems.productId],
    references: [products.id],
  }),
}));

export const creditNoteAllocations = pgTable('credit_note_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  creditNoteId: uuid('credit_note_id').references(() => creditNotes.id, { onDelete: 'cascade' }).notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  amount: decimal('amount', { precision: 20, scale: 6 }).notNull(),
  allocatedAt: timestamp('allocated_at').defaultNow(),
  allocatedBy: uuid('allocated_by').references(() => users.id),
  notes: text('notes'),
}, (table) => ({
  creditNoteIdx: index('credit_note_allocations_credit_note_idx').on(table.creditNoteId),
  invoiceIdx: index('credit_note_allocations_invoice_idx').on(table.invoiceId),
}));

export const creditNoteAllocationsRelations = relations(creditNoteAllocations, ({ one }) => ({
  creditNote: one(creditNotes, {
    fields: [creditNoteAllocations.creditNoteId],
    references: [creditNotes.id],
  }),
  invoice: one(invoices, {
    fields: [creditNoteAllocations.invoiceId],
    references: [invoices.id],
  }),
  allocatedByUser: one(users, {
    fields: [creditNoteAllocations.allocatedBy],
    references: [users.id],
  }),
}));

export type CreditNote = typeof creditNotes.$inferSelect;
export type NewCreditNote = typeof creditNotes.$inferInsert;
export type CreditNoteItem = typeof creditNoteItems.$inferSelect;
export type NewCreditNoteItem = typeof creditNoteItems.$inferInsert;
export type CreditNoteAllocation = typeof creditNoteAllocations.$inferSelect;
export type NewCreditNoteAllocation = typeof creditNoteAllocations.$inferInsert;
