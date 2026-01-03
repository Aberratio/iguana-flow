-- Update RLS policy for figures to allow everyone to view all figures
-- But restrict editing to admins and assigned experts

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view figures with training restrictions" ON public.figures;

-- Create new policy: Everyone can view all figures
CREATE POLICY "Everyone can view all figures" 
ON public.figures 
FOR SELECT 
USING (true);

-- Add policy: Experts can update figures they are assigned to
CREATE POLICY "Experts can update assigned figures"
ON public.figures
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT fe.expert_user_id 
    FROM figure_experts fe 
    WHERE fe.figure_id = figures.id
  )
);

