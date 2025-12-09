-- Drop existing function first and recreate with free_levels_count logic
DROP FUNCTION IF EXISTS public.user_can_access_sport_level(uuid, uuid);

-- Recreate function using free_levels_count instead of is_demo
CREATE OR REPLACE FUNCTION public.user_can_access_sport_level(p_user_id uuid, p_level_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  level_record RECORD;
  user_role_val TEXT;
  sport_cat_id UUID;
  has_purchase BOOLEAN;
  user_has_sport BOOLEAN;
  free_levels_count INTEGER;
BEGIN
  -- Get level info along with sport category's free_levels_count
  SELECT sl.*, sc.id as category_id, sc.key_name, COALESCE(sc.free_levels_count, 0) as free_lvl_count
  INTO level_record
  FROM sport_levels sl
  JOIN sport_categories sc ON sl.sport_category = sc.key_name
  WHERE sl.id = p_level_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  sport_cat_id := level_record.category_id;
  free_levels_count := level_record.free_lvl_count;
  
  -- Check user role - premium, trainer, admin have full access
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
  
  -- Check if level is within free levels count AND user has this sport in their profile
  IF level_record.level_number <= free_levels_count THEN
    SELECT EXISTS(
      SELECT 1 FROM profiles
      WHERE id = p_user_id AND level_record.sport_category = ANY(sports)
    ) INTO user_has_sport;
    
    RETURN user_has_sport;
  END IF;
  
  RETURN false;
END;
$function$;