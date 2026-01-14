import React, { useState, useEffect } from 'react';
import type { POSProduct } from '../types';
import { useProductsStore } from '../stores/products-store';
import { formatCurrency } from '../utils/currency';

interface ProductSearchProps {
  onSelect: (product: POSProduct) => void;
  selectedProduct: POSProduct | null;
}

export function ProductSearch({ onSelect, selectedProduct }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<POSProduct[]>([]);
  const { searchProducts } = useProductsStore();

  useEffect(() => {
    if (query.length >= 2) {
      const found = searchProducts(query, 10);
      setResults(found);
    } else {
      setResults([]);
    }
  }, [query, searchProducts]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, barcode, or SKU..."
        className="w-full px-3 py-2 border rounded"
        autoFocus
      />

      {results.length > 0 && (
        <div className="max-h-60 overflow-auto border rounded">
          {results.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelect(product)}
              className={`w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 ${
                selectedProduct?.id === product.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="font-medium">{product.name}</div>
              {product.nameAr && (
                <div className="text-sm text-gray-500" dir="rtl">
                  {product.nameAr}
                </div>
              )}
              <div className="text-sm text-gray-500">
                {product.barcode && <span className="mr-2">Barcode: {product.barcode}</span>}
                <span>{formatCurrency(product.sellingPrice, product.sellingCurrency)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && (
        <div className="text-center text-gray-500 py-4">No products found</div>
      )}
    </div>
  );
}
