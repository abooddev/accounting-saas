import { pgTable, uuid, varchar, decimal, date, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { contacts } from './contacts';
import { invoices } from './invoices';
import { moneyAccounts } from './money-accounts';
import { users } from './users';

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'supplier_payment', 'expense_payment', 'customer_receipt'
  paymentNumber: varchar('payment_number', { length: 50 }).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  accountId: uuid('account_id').references(() => moneyAccounts.id).notNull(),
  date: date('date').notNull(),
  amount: decimal('amount', { precision: 20, scale: 6 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 6 }).notNull(),
  amountLbp: decimal('amount_lbp', { precision: 20, scale: 6 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 30 }).notNull(), // 'cash', 'bank_transfer', 'check', 'whish', 'omt'
  reference: varchar('reference', { length: 255 }),
  notes: text('notes'),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  tenantTypeIdx: index('payments_tenant_type_idx').on(table.tenantId, table.type),
  tenantContactIdx: index('payments_tenant_contact_idx').on(table.tenantId, table.contactId),
  tenantInvoiceIdx: index('payments_tenant_invoice_idx').on(table.tenantId, table.invoiceId),
  tenantDateIdx: index('payments_tenant_date_idx').on(table.tenantId, table.date),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id],
  }),
  contact: one(contacts, {
    fields: [payments.contactId],
    references: [contacts.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  account: one(moneyAccounts, {
    fields: [payments.accountId],
    references: [moneyAccounts.id],
  }),
  createdByUser: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
