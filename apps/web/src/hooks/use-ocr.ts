import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ocrApi, ScanResult, OcrScan, UploadResult } from '@/lib/api/ocr';

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => ocrApi.uploadImage(file),
  });
}

export function useScanInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imagePath: string) => ocrApi.scanInvoice(imagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocr-scans'] });
    },
  });
}

export function useOcrScans() {
  return useQuery({
    queryKey: ['ocr-scans'],
    queryFn: () => ocrApi.getScans(),
  });
}

export function useOcrScan(id: string) {
  return useQuery({
    queryKey: ['ocr-scan', id],
    queryFn: () => ocrApi.getScan(id),
    enabled: !!id,
  });
}

export function useDeleteOcrScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ocrApi.deleteScan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocr-scans'] });
    },
  });
}

export function useCompleteScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scanId, invoiceId }: { scanId: string; invoiceId: string }) =>
      ocrApi.completeScan(scanId, invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocr-scans'] });
    },
  });
}

export function useOcrSuppliers() {
  return useQuery({
    queryKey: ['ocr-suppliers'],
    queryFn: () => ocrApi.getSuppliers(),
  });
}

export function useOcrProducts() {
  return useQuery({
    queryKey: ['ocr-products'],
    queryFn: () => ocrApi.getProducts(),
  });
}

export function useMatchSupplier() {
  return useMutation({
    mutationFn: (text: string) => ocrApi.matchSupplier(text),
  });
}

export function useMatchProducts() {
  return useMutation({
    mutationFn: (descriptions: string[]) => ocrApi.matchProducts(descriptions),
  });
}
