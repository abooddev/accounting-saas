'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadedUrl?: string;
  onClear?: () => void;
}

export function ImageUploader({
  onUpload,
  isUploading,
  uploadedUrl,
  onClear,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        await onUpload(file);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleClear = () => {
    setPreview(null);
    onClear?.();
  };

  if (uploadedUrl || preview) {
    return (
      <div className="relative group">
        <div className="relative overflow-hidden rounded-xl border-2 border-warm-200 bg-warm-50">
          <img
            src={preview || uploadedUrl}
            alt="Invoice preview"
            className="w-full max-h-[600px] object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cedar-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4 text-warm-700" />
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300',
        'bg-gradient-to-br from-warm-50 to-warm-100/50',
        'hover:from-cedar-50 hover:to-gold-50/30',
        isDragActive
          ? 'border-cedar-500 bg-cedar-50 scale-[1.02]'
          : 'border-warm-300 hover:border-cedar-400',
        isUploading && 'pointer-events-none opacity-60'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        {isUploading ? (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping bg-cedar-200 rounded-full" />
              <div className="relative p-5 bg-gradient-to-br from-cedar-100 to-gold-100 rounded-full">
                <Loader2 className="h-10 w-10 text-cedar-600 animate-spin" />
              </div>
            </div>
            <p className="font-display text-lg font-semibold text-cedar-700">
              Uploading invoice...
            </p>
            <p className="text-sm text-warm-500 mt-1">
              Please wait while we process your image
            </p>
          </>
        ) : (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-cedar-200/50 to-gold-200/50 rounded-full blur-xl" />
              <div className="relative p-5 bg-gradient-to-br from-cedar-100 to-gold-100 rounded-full shadow-lg">
                {isDragActive ? (
                  <ImageIcon className="h-10 w-10 text-cedar-600" />
                ) : (
                  <Upload className="h-10 w-10 text-cedar-600" />
                )}
              </div>
            </div>
            <p className="font-display text-xl font-semibold text-cedar-800">
              {isDragActive ? 'Drop your invoice here' : 'Upload Invoice Image'}
            </p>
            <p className="text-warm-600 mt-2 max-w-sm">
              Drag and drop your supplier invoice, or click to browse.
              Supports JPEG, PNG, and WebP.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                className="border-cedar-300 text-cedar-700 hover:bg-cedar-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-gold-300 text-gold-700 hover:bg-gold-50"
                onClick={(e) => {
                  e.stopPropagation();
                  // Mobile camera capture
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.capture = 'environment';
                  input.onchange = (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (file) {
                      onDrop([file]);
                    }
                  };
                  input.click();
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>
            <p className="text-xs text-warm-400 mt-4">
              Maximum file size: 10MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
