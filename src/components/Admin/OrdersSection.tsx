import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Order {
  id: string;
  user_id: string | null;
  order_type: string;
  item_id: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  stripe_session_id: string | null;
  created_at: string;
  profile?: {
    username: string;
    email: string | null;
    avatar_url: string | null;
  };
}

interface OrderStats {
  pending: number;
  completed: number;
  failed: number;
  pendingAmount: number;
  completedAmount: number;
}

export const OrdersSection: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      // Get orders
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Get profiles for users
      const userIds = [...new Set(ordersData?.map(o => o.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const mappedOrders = ordersData?.map(order => ({
        ...order,
        profile: order.user_id ? profileMap.get(order.user_id) : undefined
      })) as Order[];

      setOrders(mappedOrders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select('status, amount');

      if (error) throw error;

      const orderStats: OrderStats = {
        pending: 0,
        completed: 0,
        failed: 0,
        pendingAmount: 0,
        completedAmount: 0
      };

      allOrders?.forEach(order => {
        if (order.status === 'pending') {
          orderStats.pending++;
          orderStats.pendingAmount += order.amount || 0;
        } else if (order.status === 'completed') {
          orderStats.completed++;
          orderStats.completedAmount += order.amount || 0;
        } else if (order.status === 'failed') {
          orderStats.failed++;
        }
      });

      setStats(orderStats);
    } catch (err) {
      console.error('Error fetching order stats:', err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchOrders(), fetchStats()]);
      setIsLoading(false);
    };
    
    fetchData();
    
    // Refetch every 30 seconds (similar to refetchInterval)
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchOrders, fetchStats]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  const formatAmount = (amount: number | null, currency: string | null) => {
    if (!amount) return '-';
    const formatted = (amount / 100).toFixed(2);
    return currency === 'pln' ? `${formatted} zł` : `$${formatted}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="w-5 h-5" />
            Zamówienia i płatności
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="w-5 h-5" />
            Zamówienia i płatności
          </CardTitle>
          <Link to="/admin/orders">
            <Button variant="ghost" size="sm" className="text-xs">
              Zobacz wszystkie
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-yellow-400 text-xs mb-1">
              <Clock className="w-3 h-3" />
              Pending
            </div>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <div className="text-xs text-muted-foreground">
              {formatAmount(stats?.pendingAmount || 0, 'usd')}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </div>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <div className="text-xs text-muted-foreground">
              {formatAmount(stats?.completedAmount || 0, 'usd')}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
              <XCircle className="w-3 h-3" />
              Failed
            </div>
            <div className="text-2xl font-bold">{stats?.failed || 0}</div>
          </div>
        </div>

        {/* Warning for old pending orders */}
        {stats && stats.pending > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">
              {stats.pending} zamówień oczekuje na potwierdzenie płatności
            </span>
          </div>
        )}

        {/* Recent Orders List */}
        <ScrollArea className="h-[280px]">
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={order.profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {order.profile?.username?.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {order.profile?.username || 'Unknown User'}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {order.order_type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_at), {
                      addSuffix: true,
                      locale: pl
                    })}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-medium text-sm">
                    {formatAmount(order.amount, order.currency)}
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {order.stripe_session_id && (
                  <a
                    href={`https://dashboard.stripe.com/payments/${order.stripe_session_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                )}
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Brak zamówień
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
