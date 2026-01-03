import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Crown, Users } from 'lucide-react';

interface TopUser {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
  login_count: number | null;
}

export const TopUsersSection: React.FC = () => {
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTopUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, role, login_count')
        .not('login_count', 'is', null)
        .order('login_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTopUsers(data as TopUser[] || []);
    } catch (err) {
      console.error('Error fetching top users:', err);
      setTopUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopUsers();
    
    // Refetch every 60 seconds (similar to refetchInterval)
    const interval = setInterval(() => {
      fetchTopUsers();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchTopUsers]);

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
            <TrendingUp className="w-5 h-5" />
            Top użytkownicy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12" />
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
          <TrendingUp className="w-5 h-5" />
          Top użytkownicy
          <Badge variant="secondary" className="ml-auto text-xs">
            wg logowań
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topUsers.map((user, index) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
            >
              <div className="shrink-0 w-6 text-center">
                {index === 0 ? (
                  <Crown className="w-5 h-5 text-yellow-400 mx-auto" />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                )}
              </div>

              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {user.username?.slice(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{user.username}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0 ${getRoleBadgeColor(user.role)}`}
                  >
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 text-sm font-medium">
                <Users className="w-3 h-3 text-muted-foreground" />
                {user.login_count || 0}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
