'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Scan,
  Building2,
  Package,
  Calendar,
  Hash,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/ocr/ImageUploader';
import { AddProductDialog } from '@/components/ocr/AddProductDialog';
import {
  useUploadImage,
  useScanInvoice,
  useOcrSuppliers,
  useOcrProducts,
  useCompleteScan,
} from '@/hooks/use-ocr';
import { useCreateInvoice } from '@/hooks/use-invoices';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import type { ExtractedInvoice, SupplierMatch, ProductMatch } from '@/lib/api/ocr';
import { contactsApi } from '@/lib/api/contacts';
import { formatMoney } from '@accounting/shared';

// Format number with thousand separators for LBP
const formatLBP = (value: number): string => {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

// Parse formatted number back to raw number
const parseLBP = (value: string): number => {
  return parseFloat(value.replace(/,/g, '')) || 0;
};

interface LineItem {
  description: string;
  productId?: string;
  quantity: number;      // Total pieces
  boxQty?: number;       // Number of boxes
  piecesPerBox?: number; // Pieces per box
  unitPrice: number;
  discount: number;      // Discount value
  discountType: 'percent' | 'amount';  // 'percent' or 'amount'
  total: number;
  productMatches: ProductMatch[];
  uncertain?: boolean;   // True if AI is not confident
}

export default function ScanInvoicePage() {
  const router = useRouter();
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedInvoice | null>(null);
  const [supplierMatches, setSupplierMatches] = useState<SupplierMatch[]>([]);

  // Form state
  const [supplierId, setSupplierId] = useState<string>('');
  const [newSupplierName, setNewSupplierName] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'LBP'>('USD');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Dialog state for creating new products
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [addProductLineIndex, setAddProductLineIndex] = useState<number | null>(null);

  const uploadMutation = useUploadImage();
  const scanMutation = useScanInvoice();
  const createInvoiceMutation = useCreateInvoice();
  const completeScanMutation = useCompleteScan();

  const { data: suppliers } = useOcrSuppliers();
  const { data: products } = useOcrProducts();
  const { data: exchangeRates } = useExchangeRates();

  const currentRate = Number(exchangeRates?.[0]?.rate) || 89500;

  // Ensure arrays are arrays (API might return wrapped data)
  const suppliersArray = Array.isArray(suppliers) ? suppliers : [];
  const productsArray = Array.isArray(products) ? products : [];

  // Handle upload
  const handleUpload = async (file: File) => {
    const result = await uploadMutation.mutateAsync(file);
    setUploadedPath(result.path);
    setUploadedUrl(result.url);

    // Automatically trigger scan
    const scanResult = await scanMutation.mutateAsync(result.path);
    console.log('Scan Result:', JSON.stringify(scanResult, null, 2));
    console.log('Items:', scanResult.extracted?.items);
    setScanId(scanResult.scan.id);
    setExtracted(scanResult.extracted);
    setSupplierMatches(scanResult.supplierMatches);

    // Populate form with extracted data
    if (scanResult.extracted) {
      if (scanResult.extracted.invoiceNumber) {
        setInvoiceNumber(scanResult.extracted.invoiceNumber);
      }
      if (scanResult.extracted.date) {
        setDate(scanResult.extracted.date);
      }

      // Auto-detect currency from prices if not explicitly set
      // Prices > 1000 are likely LBP (Lebanese Pounds)
      const prices = scanResult.extracted.items.map((i) => i.unitPrice).filter(Boolean);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const detectedCurrency = avgPrice > 1000 ? 'LBP' : 'USD';
      setCurrency(scanResult.extracted.currency || detectedCurrency);

      // Set supplier if high confidence match, otherwise save extracted name for new supplier
      if (scanResult.supplierMatches.length > 0 && scanResult.supplierMatches[0].confidence >= 70) {
        setSupplierId(scanResult.supplierMatches[0].id);
      } else if (scanResult.extracted.supplier?.name) {
        setNewSupplierName(scanResult.extracted.supplier.name);
        setSupplierId('__new__');
      }

      // Set line items with defensive parsing - no calculations, use extracted values only
      const mappedItems = scanResult.extracted.items.map((item: any) => {
        const boxQty = item.boxQty ? Number(item.boxQty) : undefined;
        const piecesPerBox = item.piecesPerBox ? Number(item.piecesPerBox) : undefined;
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || 0;
        const discount = Number(item.discount) || 0;
        const discountType: 'percent' | 'amount' = item.discountType === 'percent' ? 'percent' : 'amount';
        const itemTotal = Number(item.total) || 0; // Use extracted total only, no calculation
        console.log('Mapping item:', { raw: item, boxQty, piecesPerBox, qty, price, discount, discountType, itemTotal });
        return {
          description: item.description || '',
          quantity: qty,
          boxQty,
          piecesPerBox,
          unitPrice: price,
          discount,
          discountType,
          total: itemTotal,
          productMatches: scanResult.productMatches?.[item.description] || [],
          // Only auto-select product if 100% confidence
          productId: scanResult.productMatches?.[item.description]?.[0]?.confidence === 100
            ? scanResult.productMatches[item.description][0].id
            : undefined,
          uncertain: item.uncertain || false,
        };
      });
      console.log('Final mapped items:', mappedItems);
      setLineItems(mappedItems);
    }
  };

  const handleClear = () => {
    setUploadedPath(null);
    setUploadedUrl(null);
    setScanId(null);
    setExtracted(null);
    setSupplierMatches([]);
    setSupplierId('');
    setNewSupplierName('');
    setInvoiceNumber('');
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setCurrency('USD');
    setLineItems([]);
  };

  const updateLineItem = (index: number, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, ...updates };
        // No auto-calculation - totals come from the scanned invoice
        return updated;
      })
    );
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        description: '',
        quantity: 1,
        boxQty: undefined,
        piecesPerBox: undefined,
        unitPrice: 0,
        discount: 0,
        discountType: 'amount',
        total: 0,
        productMatches: [],
        uncertain: false,
      },
    ]);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  // Handle opening the add product dialog
  const handleOpenAddProductDialog = (index: number) => {
    setAddProductLineIndex(index);
    setAddProductDialogOpen(true);
  };

  // Handle when a new product is created from the dialog
  const handleProductCreated = (product: { id: string; name: string }) => {
    if (addProductLineIndex !== null) {
      updateLineItem(addProductLineIndex, { productId: product.id });
    }
    setAddProductDialogOpen(false);
    setAddProductLineIndex(null);
  };

  // Handle product selection change
  const handleProductChange = (index: number, value: string) => {
    if (value === '__new__') {
      handleOpenAddProductDialog(index);
    } else {
      updateLineItem(index, { productId: value === '__none__' ? undefined : value });
    }
  };

  const handleCreateInvoice = async () => {
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }
    if (lineItems.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    let finalSupplierId = supplierId;

    // Auto-create supplier if __new__ is selected
    if (supplierId === '__new__') {
      const supplierName = newSupplierName || extracted?.supplier?.name;
      if (!supplierName) {
        alert('Supplier name is required');
        return;
      }
      const newSupplier = await contactsApi.create({
        type: 'supplier',
        name: supplierName,
        phone: extracted?.supplier?.phone,
        address: extracted?.supplier?.address,
      });
      finalSupplierId = newSupplier.id;
    }

    const exchangeRate = currency === 'USD' ? currentRate : 1;

    const invoice = await createInvoiceMutation.mutateAsync({
      type: 'purchase',
      supplierInvoiceNumber: invoiceNumber || undefined,
      contactId: finalSupplierId,
      date,
      dueDate: dueDate || undefined,
      currency,
      exchangeRate,
      items: lineItems.map((item) => {
        // Convert discount to percentage for invoice service
        let discountPercent = 0;
        if (item.discount > 0) {
          if (item.discountType === 'percent') {
            discountPercent = item.discount;
          } else {
            // Convert amount to percentage
            const subtotal = item.quantity * item.unitPrice;
            discountPercent = subtotal > 0 ? (item.discount / subtotal) * 100 : 0;
          }
        }
        // Filter out special values like __new__ and __none__
        const productId = item.productId && !item.productId.startsWith('__')
          ? item.productId
          : undefined;
        return {
          productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent,
        };
      }),
    });

    // Mark scan as completed
    if (scanId) {
      await completeScanMutation.mutateAsync({
        scanId,
        invoiceId: invoice.id,
      });
    }

    router.push(`/invoices/${invoice.id}`);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return (
        <Badge className="badge-success text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {confidence}%
        </Badge>
      );
    }
    if (confidence >= 50) {
      return (
        <Badge className="badge-warning text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          {confidence}%
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs text-warm-500">
        {confidence}%
      </Badge>
    );
  };

  const isProcessing = uploadMutation.isPending || scanMutation.isPending;
  const isCreating = createInvoiceMutation.isPending;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon" className="hover:bg-warm-100">
              <ArrowLeft className="h-5 w-5 text-warm-600" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cedar-100 to-gold-100 rounded-lg shadow-sm">
              <Scan className="h-6 w-6 text-cedar-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-cedar-800">
                Scan Invoice
              </h1>
              <p className="text-sm text-warm-600">
                AI-powered invoice extraction using Claude Vision
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold-500" />
          <span className="text-sm text-warm-600">Powered by AI</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Image Upload/Preview */}
        <div className="space-y-4">
          <div className="card-premium p-4">
            <h2 className="font-display text-lg font-semibold text-cedar-700 mb-4 flex items-center gap-2">
              <span className="p-1.5 bg-cedar-100 rounded">
                <Scan className="h-4 w-4 text-cedar-600" />
              </span>
              Invoice Image
            </h2>
            <ImageUploader
              onUpload={handleUpload}
              isUploading={isProcessing}
              uploadedUrl={uploadedUrl || undefined}
              onClear={handleClear}
            />
            {scanMutation.isPending && (
              <div className="mt-4 p-4 bg-gradient-to-r from-cedar-50 to-gold-50 rounded-lg border border-cedar-200">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-cedar-600 animate-spin" />
                  <div>
                    <p className="font-medium text-cedar-700">Analyzing invoice...</p>
                    <p className="text-sm text-warm-600">
                      Extracting text and matching products
                    </p>
                  </div>
                </div>
              </div>
            )}
            {extracted && (
              <div className="mt-4 p-4 bg-warm-50 rounded-lg border border-warm-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-warm-700">
                    Extraction Confidence
                  </span>
                  {getConfidenceBadge(extracted.confidence)}
                </div>
                <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      extracted.confidence >= 80
                        ? 'bg-sage-500'
                        : extracted.confidence >= 50
                        ? 'bg-gold-500'
                        : 'bg-warm-400'
                    }`}
                    style={{ width: `${extracted.confidence}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Extracted Data Form */}
        <div className="space-y-4">
          {/* Invoice Details */}
          <div className="card-premium p-4">
            <h2 className="font-display text-lg font-semibold text-cedar-700 mb-4 flex items-center gap-2">
              <span className="p-1.5 bg-gold-100 rounded">
                <Hash className="h-4 w-4 text-gold-600" />
              </span>
              Invoice Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Supplier */}
              <div className="col-span-2">
                <Label className="text-warm-700 flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-cedar-500" />
                  Supplier
                  {supplierMatches.length > 0 && supplierMatches[0].confidence >= 70 && (
                    <Badge className="badge-success text-xs ml-auto">
                      Auto-matched
                    </Badge>
                  )}
                </Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="input-warm">
                    <SelectValue placeholder="Select supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Create New Supplier Option */}
                    {(extracted?.supplier?.name || newSupplierName) && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-sage-600 bg-sage-50">
                          Create New
                        </div>
                        <SelectItem value="__new__">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-sage-500" />
                            <span>{newSupplierName || extracted?.supplier?.name}</span>
                            <Badge className="badge-info text-xs">New</Badge>
                          </div>
                        </SelectItem>
                        <div className="border-t border-warm-200 my-1" />
                      </>
                    )}
                    {supplierMatches.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-warm-500 bg-warm-50">
                          Suggested Matches
                        </div>
                        {supplierMatches.map((match) => (
                          <SelectItem key={`match-${match.id}`} value={match.id}>
                            <div className="flex items-center justify-between w-full gap-4">
                              <span>{match.name}</span>
                              {getConfidenceBadge(match.confidence)}
                            </div>
                          </SelectItem>
                        ))}
                        <div className="border-t border-warm-200 my-1" />
                      </>
                    )}
                    <div className="px-2 py-1.5 text-xs font-medium text-warm-500 bg-warm-50">
                      All Suppliers
                    </div>
                    {suppliersArray.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                        {supplier.nameAr && (
                          <span className="text-warm-500 mr-2" dir="rtl">
                            {' '}({supplier.nameAr})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Number */}
              <div>
                <Label className="text-warm-700 flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-cedar-500" />
                  Invoice Number
                </Label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-001"
                  className="input-warm"
                />
              </div>

              {/* Date */}
              <div>
                <Label className="text-warm-700 flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-cedar-500" />
                  Invoice Date
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-warm"
                />
              </div>

              {/* Due Date */}
              <div>
                <Label className="text-warm-700 flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-warm-500" />
                  Due Date
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-warm"
                />
              </div>

              {/* Currency */}
              <div>
                <Label className="text-warm-700 flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-cedar-500" />
                  Currency
                </Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as 'USD' | 'LBP')}>
                  <SelectTrigger className="input-warm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="LBP">LBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items - Full Width */}
      <div className="card-premium p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-cedar-700 flex items-center gap-2">
                <span className="p-1.5 bg-sage-100 rounded">
                  <Package className="h-4 w-4 text-sage-600" />
                </span>
                Line Items
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="border-cedar-300 text-cedar-700 hover:bg-cedar-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-warm-500">
                <Package className="h-10 w-10 mx-auto mb-3 text-warm-300" />
                <p>No items extracted yet.</p>
                <p className="text-sm">Upload an invoice to extract line items.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="table-warm">
                  <TableHeader>
                    <TableRow className="bg-warm-50">
                      <TableHead className="text-cedar-700 w-36">Description</TableHead>
                      <TableHead className="text-cedar-700 min-w-[140px] max-w-[160px]">Product</TableHead>
                      <TableHead className="text-cedar-700 w-14">Boxes</TableHead>
                      <TableHead className="text-cedar-700 w-14">Per Box</TableHead>
                      <TableHead className="text-cedar-700 w-14">Qty</TableHead>
                      <TableHead className="text-cedar-700 w-28">Price</TableHead>
                      <TableHead className="text-cedar-700 w-24">Discount</TableHead>
                      <TableHead className="text-cedar-700 w-32">Total</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow
                        key={index}
                        className={`hover:bg-warm-50 ${item.uncertain ? 'bg-amber-50 border-l-4 border-l-amber-400' : ''}`}
                        title={item.uncertain ? 'AI is uncertain about this row - please verify' : ''}
                      >
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(index, { description: e.target.value })
                            }
                            className="border rounded px-2 py-1 text-xs w-full"
                            dir={/[\u0600-\u06FF]/.test(item.description) ? 'rtl' : 'ltr'}
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell className="min-w-[140px] max-w-[160px]">
                          {(() => {
                            // Get suggested product IDs to filter from All Products
                            const suggestedIds = new Set(item.productMatches.map(m => m.id));
                            // Find selected product name for display
                            const selectedProduct = productsArray.find(p => p.id === item.productId);
                            const selectedMatch = item.productMatches.find(m => m.id === item.productId);
                            const displayName = selectedProduct?.name || selectedMatch?.name;

                            return (
                              <Select
                                value={item.productId || '__none__'}
                                onValueChange={(v) => handleProductChange(index, v)}
                              >
                                <SelectTrigger className="input-warm text-sm w-full">
                                  <span className="truncate block text-left">
                                    {item.productId === '__none__' || !item.productId
                                      ? 'No match'
                                      : displayName || 'Select...'}
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">No match</SelectItem>
                                  {/* Create New Product Option */}
                                  {item.description && (
                                    <>
                                      <SelectItem value="__new__">
                                        <div className="flex items-center gap-2">
                                          <Plus className="h-3 w-3 text-sage-500" />
                                          <span className="truncate max-w-[120px]">
                                            Create new
                                          </span>
                                        </div>
                                      </SelectItem>
                                      <div className="border-t border-warm-200 my-1" />
                                    </>
                                  )}
                                  {item.productMatches.length > 0 && (
                                    <>
                                      <div className="px-2 py-1.5 text-xs font-medium text-warm-500 bg-warm-50">
                                        Suggested
                                      </div>
                                      {item.productMatches.map((match) => (
                                        <SelectItem key={match.id} value={match.id}>
                                          <div className="flex items-center gap-2 max-w-[200px]">
                                            <span className="truncate flex-1">{match.name}</span>
                                            <span className="text-xs text-warm-400 shrink-0">
                                              {match.confidence}%
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                      <div className="border-t border-warm-200 my-1" />
                                    </>
                                  )}
                                  <div className="px-2 py-1.5 text-xs font-medium text-warm-500 bg-warm-50">
                                    All Products
                                  </div>
                                  {productsArray
                                    .filter(product => !suggestedIds.has(product.id))
                                    .map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        <span className="truncate max-w-[200px] block">{product.name}</span>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.boxQty ?? ''}
                            onChange={(e) =>
                              updateLineItem(index, {
                                boxQty: parseFloat(e.target.value) || undefined,
                              })
                            }
                            className="border rounded px-2 py-1 text-sm text-center w-16"
                            min="0"
                            step="1"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.piecesPerBox ?? ''}
                            onChange={(e) =>
                              updateLineItem(index, {
                                piecesPerBox: parseFloat(e.target.value) || undefined,
                              })
                            }
                            className="border rounded px-2 py-1 text-sm text-center w-16"
                            min="0"
                            step="1"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(index, {
                                quantity: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="border rounded px-2 py-1 text-sm text-center w-16"
                            min="0"
                            step="1"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={currency === 'LBP' ? formatLBP(item.unitPrice) : item.unitPrice}
                            onChange={(e) =>
                              updateLineItem(index, {
                                unitPrice: currency === 'LBP' ? parseLBP(e.target.value) : (parseFloat(e.target.value) || 0),
                              })
                            }
                            className="border rounded px-2 py-1 text-sm text-right w-28"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={currency === 'LBP' && item.discountType === 'amount' ? formatLBP(item.discount) : item.discount}
                              onChange={(e) =>
                                updateLineItem(index, {
                                  discount: currency === 'LBP' && item.discountType === 'amount' ? parseLBP(e.target.value) : (parseFloat(e.target.value) || 0),
                                })
                              }
                              className="border rounded px-2 py-1 text-sm text-right w-20"
                              placeholder="0"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateLineItem(index, {
                                  discountType: item.discountType === 'percent' ? 'amount' : 'percent',
                                })
                              }
                              className={`px-1.5 py-0.5 text-xs rounded border transition-colors ${
                                item.discountType === 'percent'
                                  ? 'bg-cedar-100 text-cedar-700 border-cedar-300'
                                  : 'bg-warm-100 text-warm-600 border-warm-300'
                              }`}
                              title="Click to toggle between % and amount"
                            >
                              {item.discountType === 'percent' ? '%' : currency}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={currency === 'LBP' ? formatLBP(item.total) : item.total.toFixed(2)}
                            onChange={(e) =>
                              updateLineItem(index, {
                                total: currency === 'LBP' ? parseLBP(e.target.value) : (parseFloat(e.target.value) || 0),
                              })
                            }
                            className="border rounded px-2 py-1 text-sm text-right w-32 font-medium text-cedar-700"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(index)}
                            className="text-warm-400 hover:text-terracotta-600 hover:bg-terracotta-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Totals */}
            {lineItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-warm-200">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-warm-600">
                      <span>Subtotal</span>
                      <span>{formatMoney(calculateTotal(), currency)}</span>
                    </div>
                    <div className="flex justify-between font-display text-lg font-bold text-cedar-800 pt-2 border-t border-warm-200">
                      <span>Total</span>
                      <span>{formatMoney(calculateTotal(), currency)}</span>
                    </div>
                    {extracted?.total && extracted.total !== calculateTotal() && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          Extracted total was {formatMoney(extracted.total, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleClear}
          className="border-warm-300 text-warm-700 hover:bg-warm-50"
        >
          Discard
        </Button>
        <Button
          onClick={handleCreateInvoice}
          disabled={!supplierId || lineItems.length === 0 || isCreating}
          className="btn-cedar"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Create Invoice
            </>
          )}
        </Button>
      </div>

      {/* Add Product Dialog */}
      <AddProductDialog
        open={addProductDialogOpen}
        onClose={() => {
          setAddProductDialogOpen(false);
          setAddProductLineIndex(null);
        }}
        ocrDescription={addProductLineIndex !== null ? lineItems[addProductLineIndex]?.description || '' : ''}
        supplierId={supplierId !== '__new__' ? supplierId : undefined}
        defaultPrice={addProductLineIndex !== null ? lineItems[addProductLineIndex]?.unitPrice : undefined}
        defaultCurrency={currency}
        onProductCreated={handleProductCreated}
      />
    </div>
  );
}
