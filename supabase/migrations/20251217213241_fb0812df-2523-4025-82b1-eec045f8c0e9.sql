-- Add RLS policy for sport guardians to update their sports
CREATE POLICY "Sport guardians can update their sports"
ON sport_categories FOR UPDATE
USING (
  is_sport_guardian(auth.uid(), id) 
  AND has_role(auth.uid(), 'trainer'::user_role)
)
WITH CHECK (
  is_sport_guardian(auth.uid(), id) 
  AND has_role(auth.uid(), 'trainer'::user_role)
);