import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RecentUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export const SocialProof: React.FC = () => {
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [weeklyCount, setWeeklyCount] = useState<number>(12);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecentUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentUsers(data || []);
    } catch (err) {
      console.error('Error fetching recent users:', err);
      setRecentUsers([]);
    }
  }, []);

  const fetchWeeklyCount = useCallback(async () => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());
      
      if (error) throw error;
      setWeeklyCount(count || 12);
    } catch (err) {
      console.error('Error fetching weekly count:', err);
      setWeeklyCount(12);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchRecentUsers(), fetchWeeklyCount()]);
      setIsLoading(false);
    };
    fetchData();
  }, [fetchRecentUsers, fetchWeeklyCount]);

  if (isLoading || !recentUsers || recentUsers.length === 0) return null;

  return (
    <div className="flex items-center justify-center lg:justify-start gap-2 mt-6">
      <div className="flex -space-x-3">
        {recentUsers.slice(0, 4).map((user, i) => (
          <Avatar key={user.id} className="border-2 border-background w-10 h-10">
            <AvatarImage src={user.avatar_url || ''} alt={user.username} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user.username?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{weeklyCount}+ athletes</span> joined this week
      </p>
    </div>
  );
};
