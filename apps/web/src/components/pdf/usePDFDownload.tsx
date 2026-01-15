'use client';

import { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { ReactElement } from 'react';

interface UsePDFDownloadResult {
  downloadPDF: (document: ReactElement, filename: string) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
}

export function usePDFDownload(): UsePDFDownloadResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadPDF = useCallback(async (document: ReactElement, filename: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(document as any).toBlob();
      saveAs(blob, filename);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      console.error('PDF generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { downloadPDF, isGenerating, error };
}

// Download button component wrapper for easy use
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface PDFDownloadButtonProps {
  document: ReactElement;
  filename: string;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export function PDFDownloadButton({
  document,
  filename,
  children,
  variant = 'outline',
  size = 'default',
  className,
  disabled,
}: PDFDownloadButtonProps) {
  const { downloadPDF, isGenerating, error } = usePDFDownload();

  const handleClick = async () => {
    await downloadPDF(document, filename);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={disabled || isGenerating}
      title={error || undefined}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {children || 'Download PDF'}
        </>
      )}
    </Button>
  );
}

export default usePDFDownload;
