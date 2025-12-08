import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Database,
  Users,
  ShoppingCart,
  Ticket
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  icon: React.ReactNode;
}

export const SystemHealthSection: React.FC = () => {
  const { data: healthChecks, isLoading } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      const checks: HealthCheck[] = [];
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Check 1: Database connectivity
      try {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        checks.push({
          name: 'Baza danych',
          status: 'ok',
          message: `Online - ${count} użytkowników`,
          icon: <Database className="w-4 h-4" />
        });
      } catch {
        checks.push({
          name: 'Baza danych',
          status: 'error',
          message: 'Błąd połączenia',
          icon: <Database className="w-4 h-4" />
        });
      }

      // Check 2: Old pending orders
      const { count: oldPendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('created_at', oneDayAgo);

      if (oldPendingOrders && oldPendingOrders > 0) {
        checks.push({
          name: 'Pending Orders',
          status: 'warning',
          message: `${oldPendingOrders} zamówień czeka >24h`,
          icon: <ShoppingCart className="w-4 h-4" />
        });
      } else {
        checks.push({
          name: 'Pending Orders',
          status: 'ok',
          message: 'Brak starych pending',
          icon: <ShoppingCart className="w-4 h-4" />
        });
      }

      // Check 3: Users without recent activity
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: inactiveUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or(`last_login_at.is.null,last_login_at.lt.${thirtyDaysAgo}`);

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const inactivePercent = totalUsers ? Math.round(((inactiveUsers || 0) / totalUsers) * 100) : 0;

      if (inactivePercent > 50) {
        checks.push({
          name: 'Aktywność użytkowników',
          status: 'warning',
          message: `${inactivePercent}% nieaktywnych (30d)`,
          icon: <Users className="w-4 h-4" />
        });
      } else {
        checks.push({
          name: 'Aktywność użytkowników',
          status: 'ok',
          message: `${100 - inactivePercent}% aktywnych (30d)`,
          icon: <Users className="w-4 h-4" />
        });
      }

      // Check 4: Redemption codes
      const { count: expiredCodes } = await supabase
        .from('challenge_redemption_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString());

      if (expiredCodes && expiredCodes > 0) {
        checks.push({
          name: 'Kody promocyjne',
          status: 'warning',
          message: `${expiredCodes} wygasłych aktywnych kodów`,
          icon: <Ticket className="w-4 h-4" />
        });
      } else {
        checks.push({
          name: 'Kody promocyjne',
          status: 'ok',
          message: 'Wszystkie kody aktualne',
          icon: <Ticket className="w-4 h-4" />
        });
      }

      return checks;
    },
    refetchInterval: 60000
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5" />
            Stan systemu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallStatus = healthChecks?.some(c => c.status === 'error')
    ? 'error'
    : healthChecks?.some(c => c.status === 'warning')
    ? 'warning'
    : 'ok';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5" />
          Stan systemu
          <Badge 
            className={`ml-auto ${
              overallStatus === 'ok' 
                ? 'bg-green-500/20 text-green-400' 
                : overallStatus === 'warning'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {overallStatus === 'ok' ? 'OK' : overallStatus === 'warning' ? 'Warning' : 'Error'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {healthChecks?.map((check, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusBg(check.status)}`}
            >
              <div className="shrink-0 text-muted-foreground">
                {check.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{check.name}</div>
                <div className="text-xs text-muted-foreground">{check.message}</div>
              </div>
              {getStatusIcon(check.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
