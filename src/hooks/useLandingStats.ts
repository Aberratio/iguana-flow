import { useState, useEffect, useCallback } from 'react';
import { fetchLandingStats } from '@/services/landing';
import type { LandingStats } from '@/services/landing';

export const useLandingStats = () => {
  const [data, setData] = useState<LandingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchLandingStats();
      setData(result);
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
