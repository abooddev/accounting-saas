import { pgTable, uuid, varchar, decimal, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { categories } from './categories';
import { contacts } from './contacts';

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
  nameAr: varchar('name_ar', { length: 255 }),
  barcode: varchar('barcode', { length: 100 }),
  sku: varchar('sku', { length: 100 }),
  unit: varchar('unit', { length: 20 }).default('piece').notNull().$type<'piece' | 'kg' | 'g' | 'liter' | 'ml' | 'box' | 'pack' | 'dozen'>(),
  costPrice: decimal('cost_price', { precision: 20, scale: 6 }),
  costCurrency: varchar('cost_currency', { length: 3 }).default('USD').notNull().$type<'USD' | 'LBP'>(),
  sellingPrice: decimal('selling_price', { precision: 20, scale: 6 }),
  sellingCurrency: varchar('selling_currency', { length: 3 }).default('USD').notNull().$type<'USD' | 'LBP'>(),
  trackStock: boolean('track_stock').default(true).notNull(),
  currentStock: decimal('current_stock', { precision: 20, scale: 6 }).default('0').notNull(),
  minStockLevel: decimal('min_stock_level', { precision: 20, scale: 6 }).default('0').notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  tenantCategoryIdx: index('products_tenant_category_idx').on(table.tenantId, table.categoryId),
  tenantNameIdx: index('products_tenant_name_idx').on(table.tenantId, table.name),
  uniqueBarcodePerTenant: unique('products_tenant_barcode_unique').on(table.tenantId, table.barcode),
  uniqueSkuPerTenant: unique('products_tenant_sku_unique').on(table.tenantId, table.sku),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// Product aliases for OCR matching
export const productAliases = pgTable('product_aliases', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  supplierId: uuid('supplier_id').references(() => contacts.id), // Optional: supplier-specific alias
  alias: varchar('alias', { length: 500 }).notNull(), // The OCR text or alternative name
  normalizedAlias: varchar('normalized_alias', { length: 500 }), // Lowercase, trimmed for matching
  source: varchar('source', { length: 50 }).default('manual'), // 'ocr', 'manual', 'import'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantProductIdx: index('product_aliases_tenant_product_idx').on(table.tenantId, table.productId),
  tenantSupplierIdx: index('product_aliases_tenant_supplier_idx').on(table.tenantId, table.supplierId),
  tenantAliasIdx: index('product_aliases_tenant_alias_idx').on(table.tenantId, table.normalizedAlias),
  uniqueAliasPerTenantSupplier: unique('product_aliases_tenant_supplier_alias_unique').on(table.tenantId, table.supplierId, table.normalizedAlias),
}));

export const productAliasesRelations = relations(productAliases, ({ one }) => ({
  tenant: one(tenants, {
    fields: [productAliases.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [productAliases.productId],
    references: [products.id],
  }),
  supplier: one(contacts, {
    fields: [productAliases.supplierId],
    references: [contacts.id],
  }),
}));

export type ProductAlias = typeof productAliases.$inferSelect;
export type NewProductAlias = typeof productAliases.$inferInsert;
