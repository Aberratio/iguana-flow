-- Naprawienie problemów bezpieczeństwa wykrytych przez linter

-- Sprawdzenie i włączenie RLS na tabelach restore_* (staging tables)
ALTER TABLE IF EXISTS restore_ctd_stage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS restore_tde_stage ENABLE ROW LEVEL SECURITY;

-- Polityki dla tabel staging (tylko admini)
CREATE POLICY "Only admins can manage restore_ctd_stage"
ON restore_ctd_stage FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage restore_tde_stage"
ON restore_tde_stage FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));