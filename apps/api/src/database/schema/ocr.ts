import { pgTable, uuid, varchar, decimal, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { contacts } from './contacts';
import { invoices } from './invoices';
import { users } from './users';

export const ocrScans = pgTable('ocr_scans', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  imagePath: varchar('image_path', { length: 500 }).notNull(),
  rawExtraction: jsonb('raw_extraction'), // Full Claude response
  matchedSupplierId: uuid('matched_supplier_id').references(() => contacts.id),
  matchedSupplierConfidence: decimal('matched_supplier_confidence', { precision: 5, scale: 2 }),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'reviewed', 'completed'
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
}, (table) => ({
  tenantIdx: index('ocr_scans_tenant_idx').on(table.tenantId),
  tenantStatusIdx: index('ocr_scans_tenant_status_idx').on(table.tenantId, table.status),
  tenantCreatedByIdx: index('ocr_scans_tenant_created_by_idx').on(table.tenantId, table.createdBy),
}));

export const ocrScansRelations = relations(ocrScans, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ocrScans.tenantId],
    references: [tenants.id],
  }),
  matchedSupplier: one(contacts, {
    fields: [ocrScans.matchedSupplierId],
    references: [contacts.id],
  }),
  invoice: one(invoices, {
    fields: [ocrScans.invoiceId],
    references: [invoices.id],
  }),
  createdByUser: one(users, {
    fields: [ocrScans.createdBy],
    references: [users.id],
  }),
}));

export type OcrScan = typeof ocrScans.$inferSelect;
export type NewOcrScan = typeof ocrScans.$inferInsert;

// Types for extracted invoice data
export interface ExtractedSupplier {
  name: string;
  phone?: string;
  address?: string;
}

export interface ExtractedItem {
  description: string;
  quantity: number;      // Total pieces (boxQty × piecesPerBox)
  boxQty?: number;       // Number of boxes/cartons
  piecesPerBox?: number; // Pieces per box (from *12 in description)
  unitPrice: number;     // Price per piece
  discount?: number;     // Discount value
  discountType?: 'percent' | 'amount'; // 'percent' (0-100) or 'amount' (fixed price)
  total: number;
  uncertain?: boolean;   // True if AI is not confident about this row
}

export interface ExtractedInvoice {
  supplier: ExtractedSupplier;
  invoiceNumber?: string;
  date?: string;
  currency: 'USD' | 'LBP';
  items: ExtractedItem[];
  subtotal?: number;
  total?: number;
  confidence: number;
}

export interface SupplierMatch {
  id: string;
  name: string;
  nameAr?: string;
  confidence: number;
}

export interface ProductMatch {
  id: string;
  name: string;
  nameAr?: string;
  sku?: string;
  costPrice?: string;
  confidence: number;
}
