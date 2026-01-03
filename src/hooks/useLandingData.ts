import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LandingData {
  sections: Record<string, any>;
  gallery: any[];
  pricing: any[];
}

export const useLandingData = () => {
  const [data, setData] = useState<LandingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [sectionsResult, galleryResult, pricingResult] = await Promise.all([
        supabase
          .from('landing_page_sections')
          .select('*')
          .order('display_order'),
        supabase
          .from('gallery_media')
          .select('*')
          .eq('is_active', true)
          .order('display_order')
          .limit(12),
        supabase
          .from('pricing_plans')
          .select(`
            *,
            pricing_plan_features (
              feature_key,
              is_included,
              display_order
            )
          `)
          .order('display_order'),
      ]);

      if (sectionsResult.error) throw sectionsResult.error;
      if (galleryResult.error) throw galleryResult.error;
      if (pricingResult.error) throw pricingResult.error;

      // Parse sections into easy-to-use format
      const sections = sectionsResult.data?.reduce((acc, section) => {
        acc[section.section_key] = section;
        return acc;
      }, {} as Record<string, any>) || {};

      setData({
        sections,
        gallery: galleryResult.data || [],
        pricing: pricingResult.data || [],
      });
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
