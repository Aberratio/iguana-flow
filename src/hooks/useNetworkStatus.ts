import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isChecking: false,
    lastChecked: null,
  });

  const checkConnection = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true }));
    
    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/version.json', {
        method: 'HEAD',
        cache: 'no-store',
      });
      
      setStatus({
        isOnline: response.ok,
        isChecking: false,
        lastChecked: new Date(),
      });
      
      return response.ok;
    } catch {
      setStatus({
        isOnline: false,
        isChecking: false,
        lastChecked: new Date(),
      });
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    ...status,
    checkConnection,
  };
};
