import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LandingSections {
  features?: { section_key: string; is_active: boolean };
  gallery?: { section_key: string; is_active: boolean };
  pricing?: { section_key: string; is_active: boolean };
  cta?: { section_key: string; is_active: boolean };
  instagram_feed?: { section_key: string; is_active: boolean };
}

export const useLandingSections = () => {
  const [data, setData] = useState<LandingSections | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fetchError } = await supabase
        .from('landing_page_sections')
        .select('section_key, is_active');
      
      if (fetchError) throw fetchError;

      const sectionsMap = result?.reduce((acc, section) => {
        acc[section.section_key] = section;
        return acc;
      }, {} as Record<string, { section_key: string; is_active: boolean }>) || {};

      setData({
        features: sectionsMap['features'],
        gallery: sectionsMap['gallery'],
        pricing: sectionsMap['pricing'],
        cta: sectionsMap['cta'],
        instagram_feed: sectionsMap['instagram_feed'],
      });
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      setError(fetchError);
      console.error('Error fetching landing sections:', fetchError);
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
