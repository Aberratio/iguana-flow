-- ============================================
-- FAZA 1: Struktura bazy danych dla systemu trenerów
-- ============================================

-- 1.1 Tabela sport_guardians - przypisanie opiekunów (trenerów) do sportów
CREATE TABLE public.sport_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_category_id UUID NOT NULL REFERENCES sport_categories(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sport_category_id, trainer_id)
);

-- Indeksy dla wydajności
CREATE INDEX idx_sport_guardians_trainer ON sport_guardians(trainer_id);
CREATE INDEX idx_sport_guardians_sport ON sport_guardians(sport_category_id);

-- RLS dla sport_guardians
ALTER TABLE sport_guardians ENABLE ROW LEVEL SECURITY;

-- Wszyscy zalogowani mogą widzieć opiekunów (potrzebne do wyświetlania)
CREATE POLICY "Authenticated users can view sport guardians"
ON sport_guardians FOR SELECT
TO authenticated
USING (true);

-- Tylko admini mogą zarządzać opiekunami
CREATE POLICY "Only admins can manage sport guardians"
ON sport_guardians FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 1.2 Soft delete - dodanie kolumn deleted_at
ALTER TABLE training_library ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE figures ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE sport_levels ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Indeksy dla soft delete (filtrowanie aktywnych rekordów)
CREATE INDEX IF NOT EXISTS idx_training_library_deleted ON training_library(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_challenges_deleted ON challenges(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_figures_deleted ON figures(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sport_levels_deleted ON sport_levels(deleted_at) WHERE deleted_at IS NULL;

-- 1.3 Funkcje pomocnicze

-- Sprawdzenie czy użytkownik jest opiekunem sportu (po ID)
CREATE OR REPLACE FUNCTION public.is_sport_guardian(p_user_id UUID, p_sport_category_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sport_guardians
    WHERE trainer_id = p_user_id 
    AND sport_category_id = p_sport_category_id
  )
$$;

-- Sprawdzenie czy użytkownik jest opiekunem sportu (po key_name)
CREATE OR REPLACE FUNCTION public.is_sport_guardian_by_key(p_user_id UUID, p_sport_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sport_guardians sg
    JOIN sport_categories sc ON sg.sport_category_id = sc.id
    WHERE sg.trainer_id = p_user_id 
    AND sc.key_name = p_sport_key
  )
$$;

-- ============================================
-- FAZA 2: Aktualizacja RLS Policies
-- ============================================

-- 2.1 CHALLENGES - trenerzy mogą edytować tylko SWOJE
DROP POLICY IF EXISTS "Trainers can update challenges" ON challenges;
DROP POLICY IF EXISTS "Trainers can delete challenges" ON challenges;

-- Trenerzy mogą aktualizować tylko własne challenges (nie usunięte)
CREATE POLICY "Trainers can update own challenges"
ON challenges FOR UPDATE
USING (
  auth.uid() = created_by 
  AND has_role(auth.uid(), 'trainer')
  AND deleted_at IS NULL
);

-- Trenerzy mogą soft-delete własne challenges
CREATE POLICY "Trainers can soft delete own challenges"
ON challenges FOR UPDATE
USING (
  auth.uid() = created_by 
  AND has_role(auth.uid(), 'trainer')
)
WITH CHECK (
  auth.uid() = created_by 
  AND has_role(auth.uid(), 'trainer')
);

-- Admini mogą aktualizować wszystkie challenges
CREATE POLICY "Admins can update all challenges"
ON challenges FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admini mogą usuwać challenges (hard delete)
CREATE POLICY "Admins can delete challenges"
ON challenges FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 2.2 TRAINING_LIBRARY - aktualizacja polityk
-- Najpierw sprawdźmy czy istnieją stare polityki i je usuńmy
DROP POLICY IF EXISTS "Trainers can manage training library" ON training_library;
DROP POLICY IF EXISTS "Trainers can update training library" ON training_library;
DROP POLICY IF EXISTS "Trainers can delete training library" ON training_library;

-- Trenerzy mogą tworzyć treningi
CREATE POLICY "Trainers can create trainings"
ON training_library FOR INSERT
WITH CHECK (
  auth.uid() = created_by 
  AND (has_role(auth.uid(), 'trainer') OR has_role(auth.uid(), 'admin'))
);

-- Trenerzy mogą aktualizować tylko własne treningi (nie usunięte)
CREATE POLICY "Trainers can update own trainings"
ON training_library FOR UPDATE
USING (
  auth.uid() = created_by 
  AND has_role(auth.uid(), 'trainer')
  AND deleted_at IS NULL
);

-- Admini mogą aktualizować wszystkie treningi
CREATE POLICY "Admins can update all trainings"
ON training_library FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admini mogą usuwać treningi (hard delete)
CREATE POLICY "Admins can delete trainings"
ON training_library FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Wszyscy widzą tylko nie usunięte treningi (lub admini widzą wszystkie)
DROP POLICY IF EXISTS "Everyone can view published training library" ON training_library;
CREATE POLICY "Users can view active published trainings"
ON training_library FOR SELECT
USING (
  (is_published = true AND deleted_at IS NULL)
  OR has_role(auth.uid(), 'admin')
  OR (auth.uid() = created_by AND has_role(auth.uid(), 'trainer'))
);

-- 2.3 SPORT_LEVELS - opiekunowie mogą zarządzać poziomami swoich sportów
DROP POLICY IF EXISTS "Only admins can manage sport levels" ON sport_levels;

-- Opiekunowie sportów mogą zarządzać poziomami (INSERT)
CREATE POLICY "Sport guardians can create levels"
ON sport_levels FOR INSERT
WITH CHECK (
  (is_sport_guardian_by_key(auth.uid(), sport_category) AND has_role(auth.uid(), 'trainer'))
  OR has_role(auth.uid(), 'admin')
);

-- Opiekunowie sportów mogą aktualizować poziomy (nie usunięte)
CREATE POLICY "Sport guardians can update levels"
ON sport_levels FOR UPDATE
USING (
  (is_sport_guardian_by_key(auth.uid(), sport_category) AND has_role(auth.uid(), 'trainer') AND deleted_at IS NULL)
  OR has_role(auth.uid(), 'admin')
);

-- Tylko admini mogą hard-delete poziomy
CREATE POLICY "Admins can delete levels"
ON sport_levels FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Aktualizacja polityki SELECT dla sport_levels
DROP POLICY IF EXISTS "Everyone can view published sport levels" ON sport_levels;
CREATE POLICY "Users can view active sport levels"
ON sport_levels FOR SELECT
USING (
  (status = 'published' AND deleted_at IS NULL)
  OR has_role(auth.uid(), 'admin')
  OR (is_sport_guardian_by_key(auth.uid(), sport_category) AND has_role(auth.uid(), 'trainer'))
);

-- 2.4 LEVEL_FIGURES - opiekunowie mogą zarządzać figurami w poziomach
DROP POLICY IF EXISTS "Only admins can manage level figures" ON level_figures;

-- Opiekunowie mogą zarządzać figurami w poziomach swoich sportów
CREATE POLICY "Sport guardians can manage level figures"
ON level_figures FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM sport_levels sl 
    WHERE sl.id = level_figures.level_id 
    AND (
      is_sport_guardian_by_key(auth.uid(), sl.sport_category) AND has_role(auth.uid(), 'trainer')
      OR has_role(auth.uid(), 'admin')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sport_levels sl 
    WHERE sl.id = level_figures.level_id 
    AND (
      is_sport_guardian_by_key(auth.uid(), sl.sport_category) AND has_role(auth.uid(), 'trainer')
      OR has_role(auth.uid(), 'admin')
    )
  )
);

-- 2.5 LEVEL_TRAININGS - opiekunowie mogą zarządzać treningami w poziomach
DROP POLICY IF EXISTS "Only admins can manage level trainings" ON level_trainings;

CREATE POLICY "Sport guardians can manage level trainings"
ON level_trainings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM sport_levels sl 
    WHERE sl.id = level_trainings.level_id 
    AND (
      is_sport_guardian_by_key(auth.uid(), sl.sport_category) AND has_role(auth.uid(), 'trainer')
      OR has_role(auth.uid(), 'admin')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sport_levels sl 
    WHERE sl.id = level_trainings.level_id 
    AND (
      is_sport_guardian_by_key(auth.uid(), sl.sport_category) AND has_role(auth.uid(), 'trainer')
      OR has_role(auth.uid(), 'admin')
    )
  )
);