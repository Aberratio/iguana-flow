-- Add pricing columns to sport_categories
ALTER TABLE sport_categories ADD COLUMN IF NOT EXISTS price_usd INTEGER DEFAULT 4999;
ALTER TABLE sport_categories ADD COLUMN IF NOT EXISTS price_pln INTEGER DEFAULT 19999;

-- Add is_demo column to sport_levels
ALTER TABLE sport_levels ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Set first level of each sport as demo by default
UPDATE sport_levels 
SET is_demo = true 
WHERE level_number = 1;

-- Create user_sport_purchases table for tracking sport path purchases
CREATE TABLE IF NOT EXISTS user_sport_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sport_category_id UUID NOT NULL REFERENCES sport_categories(id) ON DELETE CASCADE,
  purchase_type TEXT NOT NULL DEFAULT 'payment', -- 'payment' | 'redemption' | 'admin_grant'
  payment_amount INTEGER,
  currency TEXT DEFAULT 'usd',
  stripe_session_id TEXT,
  redemption_code TEXT,
  notes TEXT,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, sport_category_id)
);

-- Enable RLS
ALTER TABLE user_sport_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sport_purchases
CREATE POLICY "Users can view their own sport purchases"
  ON user_sport_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sport purchases"
  ON user_sport_purchases FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can insert sport purchases"
  ON user_sport_purchases FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can update sport purchases"
  ON user_sport_purchases FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can delete sport purchases"
  ON user_sport_purchases FOR DELETE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Edge functions can manage sport purchases"
  ON user_sport_purchases FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create sport_redemption_codes table
CREATE TABLE IF NOT EXISTS sport_redemption_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  sport_category_id UUID REFERENCES sport_categories(id) ON DELETE CASCADE,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for sport_redemption_codes
ALTER TABLE sport_redemption_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active sport redemption codes"
  ON sport_redemption_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage sport redemption codes"
  ON sport_redemption_codes FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Create function to check if user has access to a sport path
CREATE OR REPLACE FUNCTION user_has_sport_path_access(p_user_id UUID, p_sport_category_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_val TEXT;
  has_purchase BOOLEAN;
BEGIN
  -- Check user role (premium, trainer, admin have full access)
  SELECT role INTO user_role_val
  FROM profiles
  WHERE id = p_user_id;
  
  IF user_role_val IN ('premium', 'trainer', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Check if user has purchased this sport path
  SELECT EXISTS(
    SELECT 1 FROM user_sport_purchases
    WHERE user_id = p_user_id AND sport_category_id = p_sport_category_id
  ) INTO has_purchase;
  
  RETURN has_purchase;
END;
$$;

-- Create function to check if user can access a specific sport level
CREATE OR REPLACE FUNCTION user_can_access_sport_level(p_user_id UUID, p_level_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  level_record RECORD;
  user_role_val TEXT;
  sport_cat_id UUID;
  has_purchase BOOLEAN;
  user_has_sport BOOLEAN;
BEGIN
  -- Get level info
  SELECT sl.*, sc.id as category_id, sc.key_name
  INTO level_record
  FROM sport_levels sl
  JOIN sport_categories sc ON sl.sport_category = sc.key_name
  WHERE sl.id = p_level_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  sport_cat_id := level_record.category_id;
  
  -- Check user role
  SELECT role INTO user_role_val
  FROM profiles
  WHERE id = p_user_id;
  
  IF user_role_val IN ('premium', 'trainer', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Check if user purchased this sport
  SELECT EXISTS(
    SELECT 1 FROM user_sport_purchases
    WHERE user_id = p_user_id AND sport_category_id = sport_cat_id
  ) INTO has_purchase;
  
  IF has_purchase THEN
    RETURN true;
  END IF;
  
  -- Check if level is demo AND user has this sport in their profile
  IF level_record.is_demo THEN
    SELECT EXISTS(
      SELECT 1 FROM profiles
      WHERE id = p_user_id AND level_record.sport_category = ANY(sports)
    ) INTO user_has_sport;
    
    RETURN user_has_sport;
  END IF;
  
  RETURN false;
END;
$$;