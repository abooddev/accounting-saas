import { useState, useEffect } from 'react';
import { useSyncStore } from '../stores/sync-store';

export function useOfflineStatus() {
  const { setOnline } = useSyncStore();
  const [isOnline, setIsOnlineState] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineState(true);
      setOnline(true);
    };

    const handleOffline = () => {
      setIsOnlineState(false);
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return isOnline;
}
