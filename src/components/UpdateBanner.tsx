import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

export const UpdateBanner = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      
      // Check for updates every 60 minutes
      r && setInterval(() => {
        console.log('SW checking for updates...');
        r.update();
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  // Only show banner when:
  // 1. User is logged in
  // 2. New version is available
  // 3. User hasn't dismissed the banner
  if (!user || !needRefresh || dismissed) {
    return null;
  }

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
      <RefreshCw className="h-4 w-4 animate-spin" />
      <span className="text-sm font-medium">
        Dostępna jest nowa wersja aplikacji
      </span>
      <Button 
        size="sm" 
        variant="secondary"
        onClick={handleUpdate}
        className="h-7 px-3 text-xs"
      >
        Aktualizuj teraz
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={handleDismiss}
        className="h-7 w-7 p-0 hover:bg-primary-foreground/20"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
