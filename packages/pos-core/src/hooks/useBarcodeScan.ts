import { useEffect, useCallback, useRef } from 'react';

interface UseBarcodeScanOptions {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  minLength?: number;
  maxDelay?: number;
  enabled?: boolean;
}

/**
 * USB Barcode Scanner Hook
 *
 * USB barcode scanners work as keyboard emulation.
 * They type the barcode very fast and press Enter at the end.
 *
 * This hook detects rapid keystrokes followed by Enter.
 */
export function useBarcodeScan({
  onScan,
  onError,
  minLength = 4,
  maxDelay = 50,
  enabled = true,
}: UseBarcodeScanOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if focus is on an input field (let user type normally)
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: if it's our scan input, let it through
        if (!target.dataset.scanInput) {
          return;
        }
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;

      // If too much time passed, reset buffer
      if (timeDiff > maxDelay && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      lastKeyTimeRef.current = now;

      // Handle Enter key
      if (event.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          // Valid barcode!
          event.preventDefault();
          onScan(bufferRef.current);
        }
        bufferRef.current = '';
        return;
      }

      // Handle regular characters
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        bufferRef.current += event.key;

        // Prevent buffer from growing too large
        if (bufferRef.current.length > 50) {
          bufferRef.current = bufferRef.current.slice(-50);
        }
      }
    },
    [enabled, minLength, maxDelay, onScan]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  // Manual scan function (for on-screen input)
  const manualScan = useCallback(
    (barcode: string) => {
      if (barcode.length >= minLength) {
        onScan(barcode);
      } else {
        onError?.(`Barcode too short (minimum ${minLength} characters)`);
      }
    },
    [minLength, onScan, onError]
  );

  return { manualScan };
}
