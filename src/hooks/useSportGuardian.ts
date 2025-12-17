import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SportGuardianship {
  sport_category_id: string;
  sport_name: string;
  sport_key: string;
}

export const useSportGuardian = () => {
  const { user } = useAuth();
  const [guardianships, setGuardianships] = useState<SportGuardianship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuardianships = async () => {
      if (!user) {
        setGuardianships([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('sport_guardians')
          .select(`
            sport_category_id,
            sport_categories!inner (
              id,
              name,
              key_name
            )
          `)
          .eq('trainer_id', user.id);

        if (fetchError) throw fetchError;

        const mappedData: SportGuardianship[] = (data || []).map((item: any) => ({
          sport_category_id: item.sport_category_id,
          sport_name: item.sport_categories.name,
          sport_key: item.sport_categories.key_name,
        }));

        setGuardianships(mappedData);
      } catch (err: any) {
        console.error('Error fetching sport guardianships:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuardianships();
  }, [user]);

  const isGuardianOf = (sportCategoryId: string): boolean => {
    return guardianships.some(g => g.sport_category_id === sportCategoryId);
  };

  const isGuardianOfByKey = (sportKey: string): boolean => {
    return guardianships.some(g => g.sport_key === sportKey);
  };

  const hasAnyGuardianship = guardianships.length > 0;

  return {
    guardianships,
    isLoading,
    error,
    isGuardianOf,
    isGuardianOfByKey,
    hasAnyGuardianship,
  };
};
