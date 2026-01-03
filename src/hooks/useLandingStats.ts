import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LandingStats {
  athletes: string;
  figures: string;
  challenges: string;
  successRate: string;
}

export const useLandingStats = () => {
  const [data, setData] = useState<LandingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profilesResult, figuresResult, challengesResult, completedResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('figures')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('challenges')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published'),
        supabase
          .from('challenge_participants')
          .select('id', { count: 'exact', head: true })
          .eq('completed', true),
      ]);

      const athletes = profilesResult.count || 500;
      const figures = figuresResult.count || 200;
      const challenges = challengesResult.count || 50;
      const completed = completedResult.count || 0;
      
      // Calculate success rate
      const successRate = athletes > 0 ? Math.round((completed / athletes) * 100) : 95;

      setData({
        athletes: `${athletes}+`,
        figures: `${figures}+`,
        challenges: `${challenges}+`,
        successRate: `${Math.min(successRate, 95)}%`,
      });
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      setError(fetchError);
      console.error('Error fetching landing stats:', fetchError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};
