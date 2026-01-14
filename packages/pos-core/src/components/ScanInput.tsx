import React, { useRef, useEffect } from 'react';

interface ScanInputProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ScanInput({
  onSubmit,
  disabled = false,
  placeholder = 'Scan barcode...',
  autoFocus = true,
}: ScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled]);

  useEffect(() => {
    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.focus();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = inputRef.current?.value.trim();
      if (value) {
        onSubmit(value);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        data-scan-input="true"
        disabled={disabled}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-4 text-2xl border-2 border-blue-500 rounded-lg
                   focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200
                   disabled:bg-gray-100 disabled:border-gray-300"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
      </div>
    </div>
  );
}
