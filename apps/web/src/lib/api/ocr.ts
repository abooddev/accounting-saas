import { apiClient } from './client';

export interface ExtractedSupplier {
  name: string;
  phone?: string;
  address?: string;
}

export interface ExtractedItem {
  description: string;
  quantity: number;
  boxQty?: number;
  piecesPerBox?: number;
  unitPrice: number;
  discount?: number;
  discountType?: 'percent' | 'amount';  // 'percent' (0-100) or 'amount' (fixed price)
  total: number;
  uncertain?: boolean;  // True if AI is not confident about this row
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

export interface OcrScan {
  id: string;
  tenantId: string;
  imagePath: string;
  rawExtraction: ExtractedInvoice | null;
  matchedSupplierId?: string;
  matchedSupplierConfidence?: string;
  status: 'pending' | 'reviewed' | 'completed';
  invoiceId?: string;
  createdBy: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ScanResult {
  scan: OcrScan;
  extracted: ExtractedInvoice;
  supplierMatches: SupplierMatch[];
  productMatches: Record<string, ProductMatch[]>;
}

export interface UploadResult {
  path: string;
  filename: string;
  url: string;
}

// Helper to unwrap API response
const unwrap = <T>(response: { data: { success: boolean; data: T } | T }): T => {
  const data = response.data as any;
  if (data && data.success === true && 'data' in data) {
    return data.data;
  }
  return data;
};

export const ocrApi = {
  uploadImage: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return unwrap(response);
  },

  scanInvoice: async (imagePath: string): Promise<ScanResult> => {
    const response = await apiClient.post('/ocr/scan', { imagePath });
    return unwrap(response);
  },

  getScans: async (): Promise<OcrScan[]> => {
    const response = await apiClient.get('/ocr/scans');
    return unwrap(response);
  },

  getScan: async (id: string): Promise<OcrScan> => {
    const response = await apiClient.get(`/ocr/scans/${id}`);
    return unwrap(response);
  },

  deleteScan: async (id: string): Promise<void> => {
    await apiClient.delete(`/ocr/scans/${id}`);
  },

  completeScan: async (id: string, invoiceId: string): Promise<OcrScan> => {
    const response = await apiClient.post(`/ocr/scans/${id}/complete`, { invoiceId });
    return unwrap(response);
  },

  getSuppliers: async (): Promise<{ id: string; name: string; nameAr?: string }[]> => {
    const response = await apiClient.get('/ocr/suppliers');
    return unwrap(response);
  },

  getProducts: async (): Promise<{
    id: string;
    name: string;
    nameAr?: string;
    sku?: string;
    costPrice?: string;
    unit?: string;
  }[]> => {
    const response = await apiClient.get('/ocr/products');
    return unwrap(response);
  },

  matchSupplier: async (text: string): Promise<SupplierMatch[]> => {
    const response = await apiClient.post('/ocr/match-supplier', { text });
    return unwrap(response);
  },

  matchProducts: async (
    descriptions: string[],
    supplierId?: string,
  ): Promise<Record<string, ProductMatch[]>> => {
    const response = await apiClient.post('/ocr/match-products', { descriptions, supplierId });
    return unwrap(response);
  },

  createProductAlias: async (productId: string, alias: string, supplierId?: string): Promise<void> => {
    await apiClient.post('/ocr/product-alias', { productId, alias, supplierId });
  },
};
