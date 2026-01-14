export type ProductUnit = 'piece' | 'kg' | 'g' | 'liter' | 'ml' | 'box' | 'pack' | 'dozen';
export type Currency = 'USD' | 'LBP';

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string | null;
  name: string;
  nameAr: string | null;
  barcode: string | null;
  sku: string | null;
  unit: ProductUnit;
  costPrice: number | null;
  costCurrency: Currency;
  sellingPrice: number | null;
  sellingCurrency: Currency;
  trackStock: boolean;
  currentStock: number;
  minStockLevel: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ProductWithCategory extends Product {
  category: {
    id: string;
    name: string;
    nameAr: string | null;
  } | null;
}

export interface CreateProductInput {
  categoryId?: string;
  name: string;
  nameAr?: string;
  barcode?: string;
  sku?: string;
  unit?: ProductUnit;
  costPrice?: number;
  costCurrency?: Currency;
  sellingPrice?: number;
  sellingCurrency?: Currency;
  trackStock?: boolean;
  currentStock?: number;
  minStockLevel?: number;
  imageUrl?: string;
}

export interface UpdateProductInput {
  categoryId?: string | null;
  name?: string;
  nameAr?: string;
  barcode?: string;
  sku?: string;
  unit?: ProductUnit;
  costPrice?: number;
  costCurrency?: Currency;
  sellingPrice?: number;
  sellingCurrency?: Currency;
  trackStock?: boolean;
  currentStock?: number;
  minStockLevel?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
}
