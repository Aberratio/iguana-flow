-- Add free_levels_count column to sport_categories
-- This defines how many first levels of a sport are free (0 = all paid, null = use is_demo per level)
ALTER TABLE public.sport_categories 
ADD COLUMN free_levels_count integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.sport_categories.free_levels_count IS 'Number of first levels that are free (0 = all paid except demo levels)';