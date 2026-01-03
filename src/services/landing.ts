import { supabase } from '@/integrations/supabase/client';
import type { TableRow } from './types';
import { throwIfError } from './utils';

/**
 * Type definitions for landing page
 */

type LandingPageSectionRow = TableRow<'landing_page_sections'>;
type GalleryMediaRow = TableRow<'gallery_media'>;
type PricingPlanRow = TableRow<'pricing_plans'>;

/**
 * Landing page section
 */
export interface LandingPageSection extends LandingPageSectionRow {
  // Additional fields can be added here
}

/**
 * Gallery media item
 */
export interface GalleryMedia extends GalleryMediaRow {
  // Additional fields can be added here
}

/**
 * Pricing plan with features
 */
export interface PricingPlanWithFeatures extends PricingPlanRow {
  pricing_plan_features: Array<{
    feature_key: string;
    is_included: boolean;
    display_order: number;
  }>;
}

/**
 * Landing page data
 */
export interface LandingData {
  sections: Record<string, LandingPageSection>;
  gallery: GalleryMedia[];
  pricing: PricingPlanWithFeatures[];
}

/**
 * Fetch all landing page data
 */
export const fetchLandingData = async (): Promise<LandingData> => {
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
  const sections = (sectionsResult.data || []).reduce((acc, section) => {
    acc[section.section_key] = section;
    return acc;
  }, {} as Record<string, LandingPageSection>);

  return {
    sections,
    gallery: galleryResult.data || [],
    pricing: (pricingResult.data || []) as PricingPlanWithFeatures[],
  };
};

/**
 * Fetch landing page sections
 */
export const fetchLandingSections = async (): Promise<Record<string, { section_key: string; is_active: boolean }>> => {
  const { data, error } = await supabase
    .from('landing_page_sections')
    .select('section_key, is_active');

  if (error) throw error;

  return (data || []).reduce((acc, section) => {
    acc[section.section_key] = section;
    return acc;
  }, {} as Record<string, { section_key: string; is_active: boolean }>);
};

/**
 * Landing statistics
 */
export interface LandingStats {
  athletes: string;
  figures: string;
  challenges: string;
  successRate: string;
}

/**
 * Fetch landing page statistics
 */
export const fetchLandingStats = async (): Promise<LandingStats> => {
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

  return {
    athletes: `${athletes}+`,
    figures: `${figures}+`,
    challenges: `${challenges}+`,
    successRate: `${Math.min(successRate, 95)}%`,
  };
};

