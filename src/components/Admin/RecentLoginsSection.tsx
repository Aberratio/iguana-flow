import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Users, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface RecentUser {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
  last_login_at: string | null;
  login_count: number | null;
}

export const RecentLoginsSection: React.FC = () => {
  const { impersonateUser } = useAuth();

  const { data: recentLogins, isLoading } = useQuery({
    queryKey: ['admin-recent-logins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, role, last_login_at, login_count')
        .not('last_login_at', 'is', null)
        .order('last_login_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as RecentUser[];
    },
    refetchInterval: 30000
  });

  const handleImpersonate = async (userId: string, username: string) => {
    try {
      await impersonateUser(userId);
      toast.success(`Teraz widzisz aplikację jako ${username}`);
    } catch (error) {
      toast.error('Nie udało się impersonować użytkownika');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'trainer': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'premium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Ostatnio zalogowani
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5" />
          Ostatnio zalogowani
          <Badge variant="secondary" className="ml-auto">
            {recentLogins?.length || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4 pb-4">
          <div className="space-y-2">
            {recentLogins?.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user.username?.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{user.username}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {user.last_login_at
                        ? formatDistanceToNow(new Date(user.last_login_at), {
                            addSuffix: true,
                            locale: pl
                          })
                        : 'Nigdy'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {user.login_count || 0} logowań
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => handleImpersonate(user.id, user.username)}
                >
                  <UserCheck className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
