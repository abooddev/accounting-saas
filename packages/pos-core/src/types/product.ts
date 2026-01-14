export interface POSProduct {
  id: string;
  barcode: string | null;
  sku: string | null;
  name: string;
  nameAr: string | null;
  categoryId: string | null;
  categoryName: string | null;
  unit: string;
  sellingPrice: number;
  sellingCurrency: 'USD' | 'LBP';
  costPrice: number | null;
  currentStock: number;
  trackStock: boolean;
  imageUrl: string | null;
}

export interface POSCategory {
  id: string;
  name: string;
  nameAr: string | null;
  parentId: string | null;
}
