import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const OfflineNotification = () => {
  const { isOnline, isChecking, checkConnection } = useNetworkStatus();
  const [showNotification, setShowNotification] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowNotification(true);
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Show briefly that we're back online
      setTimeout(() => {
        setShowNotification(false);
        setWasOffline(false);
      }, 2000);
    }
  }, [isOnline, wasOffline]);

  // Auto-retry every 10 seconds when offline
  useEffect(() => {
    if (!isOnline && !isChecking) {
      const interval = setInterval(() => {
        checkConnection();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isOnline, isChecking, checkConnection]);

  if (!showNotification) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            isOnline 
              ? 'bg-green-500/20' 
              : 'bg-destructive/20'
          }`}>
            {isOnline ? (
              <Wifi className="h-8 w-8 text-green-500" />
            ) : (
              <WifiOff className="h-8 w-8 text-destructive animate-pulse" />
            )}
          </div>

          <h2 className="mb-2 text-xl font-semibold text-foreground">
            {isOnline ? 'Połączenie przywrócone!' : 'Brak połączenia z internetem'}
          </h2>
          
          <p className="mb-6 text-sm text-muted-foreground">
            {isOnline 
              ? 'Wszystko działa poprawnie.' 
              : 'Sprawdź swoje połączenie z internetem i spróbuj ponownie.'}
          </p>

          {!isOnline && (
            <>
              <Button
                onClick={checkConnection}
                disabled={isChecking}
                className="w-full"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sprawdzanie...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Spróbuj ponownie
                  </>
                )}
              </Button>

              <p className="mt-4 text-xs text-muted-foreground">
                Automatyczne sprawdzanie co 10 sekund
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
