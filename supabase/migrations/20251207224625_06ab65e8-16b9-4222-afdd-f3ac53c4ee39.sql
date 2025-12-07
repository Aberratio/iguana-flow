-- ===========================================
-- FIX: Prevent challenge progress loss (v2)
-- Handles duplicate constraint conflicts
-- ===========================================

-- Step 1: Create trigger function to prevent deletion of training days with user progress
CREATE OR REPLACE FUNCTION public.prevent_training_day_deletion_with_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.challenge_day_progress WHERE training_day_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot delete training day with existing user progress. Day ID: %, has associated progress records.', OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 2: Create trigger on challenge_training_days
DROP TRIGGER IF EXISTS tr_prevent_training_day_deletion ON public.challenge_training_days;
CREATE TRIGGER tr_prevent_training_day_deletion
BEFORE DELETE ON public.challenge_training_days
FOR EACH ROW EXECUTE FUNCTION public.prevent_training_day_deletion_with_progress();

-- Step 3: Fix orphaned progress records
-- Delete orphaned records that can't be remapped (where user already has progress for that day)
-- This is safer than trying to merge/update which could cause conflicts

-- First, identify orphaned records
WITH orphaned AS (
  SELECT 
    cdp.id as progress_id,
    cdp.user_id,
    cdp.challenge_id,
    cdp.training_day_id as old_training_day_id,
    cdp.created_at,
    cdp.attempt_number,
    ROW_NUMBER() OVER (PARTITION BY cdp.user_id, cdp.challenge_id ORDER BY cdp.created_at) as day_position
  FROM public.challenge_day_progress cdp
  WHERE NOT EXISTS (
    SELECT 1 FROM public.challenge_training_days ctd 
    WHERE ctd.id = cdp.training_day_id
  )
),
-- Check which orphaned records would conflict with existing valid records
with_conflicts AS (
  SELECT 
    o.*,
    ctd.id as new_training_day_id,
    CASE WHEN EXISTS (
      SELECT 1 FROM public.challenge_day_progress existing
      WHERE existing.user_id = o.user_id 
        AND existing.challenge_id = o.challenge_id 
        AND existing.training_day_id = ctd.id
        AND existing.attempt_number = o.attempt_number
    ) THEN true ELSE false END as has_conflict
  FROM orphaned o
  LEFT JOIN public.challenge_training_days ctd 
    ON ctd.challenge_id = o.challenge_id 
    AND ctd.day_number = o.day_position
)
-- Update orphaned records that DON'T have conflicts
UPDATE public.challenge_day_progress cdp
SET training_day_id = wc.new_training_day_id
FROM with_conflicts wc
WHERE cdp.id = wc.progress_id
  AND wc.new_training_day_id IS NOT NULL
  AND wc.has_conflict = false;

-- Step 4: Delete remaining orphaned records (those with conflicts or no mapping)
DELETE FROM public.challenge_day_progress cdp
WHERE NOT EXISTS (
  SELECT 1 FROM public.challenge_training_days ctd 
  WHERE ctd.id = cdp.training_day_id
);

-- Step 5: Update challenge_participants to reflect correct progress
UPDATE public.challenge_participants cp
SET 
  last_completed_day = COALESCE((
    SELECT MAX(ctd.day_number)
    FROM public.challenge_day_progress cdp
    JOIN public.challenge_training_days ctd ON ctd.id = cdp.training_day_id
    WHERE cdp.user_id = cp.user_id 
      AND cdp.challenge_id = cp.challenge_id 
      AND cdp.status = 'completed'
  ), 0),
  current_day_number = COALESCE((
    SELECT MAX(ctd.day_number) + 1
    FROM public.challenge_day_progress cdp
    JOIN public.challenge_training_days ctd ON ctd.id = cdp.training_day_id
    WHERE cdp.user_id = cp.user_id 
      AND cdp.challenge_id = cp.challenge_id 
      AND cdp.status = 'completed'
  ), 1),
  updated_at = now();

-- Step 6: Add foreign key constraint with ON DELETE RESTRICT
ALTER TABLE public.challenge_day_progress
DROP CONSTRAINT IF EXISTS fk_challenge_day_progress_training_day;

ALTER TABLE public.challenge_day_progress
ADD CONSTRAINT fk_challenge_day_progress_training_day
FOREIGN KEY (training_day_id) 
REFERENCES public.challenge_training_days(id)
ON DELETE RESTRICT;