import { useState, useEffect, useCallback } from 'react';
import { fetchLandingData } from '@/services/landing';
import type { LandingData } from '@/services/landing';

export const useLandingData = () => {
  const [data, setData] = useState<LandingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchLandingData();
      setData(result);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      setError(fetchError);
      console.error('Error fetching landing data:', fetchError);
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
