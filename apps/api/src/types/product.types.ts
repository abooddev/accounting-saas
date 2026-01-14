import { Product } from '../database/schema';

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
}

export interface ProductWithCategory extends Product {
  category: {
    id: string;
    name: string;
    nameAr: string | null;
  } | null;
}
