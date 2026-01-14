import React, { useState } from 'react';
import type { POSProduct } from '../types';
import { ProductSearch } from './ProductSearch';

interface UnknownBarcodeModalProps {
  barcode: string;
  onLink: (product: POSProduct) => void;
  onCancel: () => void;
}

export function UnknownBarcodeModal({ barcode, onLink, onCancel }: UnknownBarcodeModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<POSProduct | null>(null);

  const handleLink = () => {
    if (!selectedProduct) return;
    onLink(selectedProduct);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b bg-yellow-50">
          <div className="flex items-center gap-2 text-yellow-800">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-bold">Unknown Barcode</h2>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Scanned Barcode:</div>
            <div className="text-2xl font-mono font-bold">{barcode}</div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Search for the product to link this barcode. The link will be saved for future scans.
          </p>

          <ProductSearch onSelect={setSelectedProduct} selectedProduct={selectedProduct} />

          {selectedProduct && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="font-medium">{selectedProduct.name}</div>
              {selectedProduct.nameAr && (
                <div className="text-sm text-gray-600" dir="rtl">
                  {selectedProduct.nameAr}
                </div>
              )}
              <div className="text-sm text-gray-600">
                Price: ${selectedProduct.sellingPrice.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            This link will be pending manager verification. The sale will continue normally.
          </div>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={!selectedProduct}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold
                       hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Link & Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
