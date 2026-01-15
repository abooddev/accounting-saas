import { pgTable, uuid, varchar, decimal, boolean, timestamp, integer, index, unique } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { products } from './products';
import { contacts } from './contacts';

export const priceLists = pgTable('price_lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  nameAr: varchar('name_ar', { length: 255 }),
  currency: varchar('currency', { length: 3 }).default('USD').notNull().$type<'USD' | 'LBP'>(),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  tenantIdx: index('price_lists_tenant_idx').on(table.tenantId),
  tenantNameIdx: index('price_lists_tenant_name_idx').on(table.tenantId, table.name),
  tenantDefaultIdx: index('price_lists_tenant_default_idx').on(table.tenantId, table.isDefault),
}));

export const priceListItems = pgTable('price_list_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  priceListId: uuid('price_list_id').references(() => priceLists.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  price: decimal('price', { precision: 20, scale: 6 }).notNull(),
  minQuantity: integer('min_quantity').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  priceListIdx: index('price_list_items_price_list_idx').on(table.priceListId),
  productIdx: index('price_list_items_product_idx').on(table.productId),
  priceListProductMinQtyIdx: index('price_list_items_list_product_qty_idx').on(table.priceListId, table.productId, table.minQuantity),
  uniquePriceListProductMinQty: unique('price_list_items_unique').on(table.priceListId, table.productId, table.minQuantity),
}));

export const customerPriceLists = pgTable('customer_price_lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => contacts.id).notNull(),
  priceListId: uuid('price_list_id').references(() => priceLists.id).notNull(),
  priority: integer('priority').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('customer_price_lists_customer_idx').on(table.customerId),
  priceListIdx: index('customer_price_lists_price_list_idx').on(table.priceListId),
  customerPriorityIdx: index('customer_price_lists_customer_priority_idx').on(table.customerId, table.priority),
  uniqueCustomerPriceList: unique('customer_price_lists_unique').on(table.customerId, table.priceListId),
}));

export type PriceList = typeof priceLists.$inferSelect;
export type NewPriceList = typeof priceLists.$inferInsert;

export type PriceListItem = typeof priceListItems.$inferSelect;
export type NewPriceListItem = typeof priceListItems.$inferInsert;

export type CustomerPriceList = typeof customerPriceLists.$inferSelect;
export type NewCustomerPriceList = typeof customerPriceLists.$inferInsert;
