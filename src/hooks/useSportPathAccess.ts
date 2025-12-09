import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SportPathAccess {
  sportCategoryId: string;
  sportName: string;
  sportKeyName: string;
  hasFullAccess: boolean; // User purchased or is premium
  hasDemoAccess: boolean; // User has sport in profile but not purchased
  isPurchased: boolean;
  priceUsd: number | null;
  pricePln: number | null;
}

interface SportPurchase {
  sport_category_id: string;
  purchase_type: string;
  purchased_at: string;
}

export const useSportPathAccess = () => {
  const { user } = useAuth();
  const [sportAccess, setSportAccess] = useState<SportPathAccess[]>([]);
  const [purchases, setPurchases] = useState<SportPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  const fetchAccess = useCallback(async () => {
    if (!user) {
      setSportAccess([]);
      setPurchases([]);
      setIsPremiumUser(false);
      setIsLoading(false);
      return;
    }

    try {
      // Get user profile with role and sports
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, sports')
        .eq('id', user.id)
        .single();

      const userRole = profile?.role || 'free';
      const userSports = profile?.sports || [];
      const isPremium = ['premium', 'trainer', 'admin'].includes(userRole);
      setIsPremiumUser(isPremium);

      // Get user's sport purchases
      const { data: userPurchases } = await supabase
        .from('user_sport_purchases')
        .select('sport_category_id, purchase_type, purchased_at')
        .eq('user_id', user.id);

      setPurchases(userPurchases || []);
      const purchasedSportIds = new Set((userPurchases || []).map(p => p.sport_category_id));

      // Get all published sport categories with prices
      const { data: sportCategories } = await supabase
        .from('sport_categories')
        .select('id, name, key_name, price_usd, price_pln')
        .eq('is_published', true);

      if (!sportCategories) {
        setSportAccess([]);
        setIsLoading(false);
        return;
      }

      const accessList: SportPathAccess[] = sportCategories.map(sport => {
        const isPurchased = purchasedSportIds.has(sport.id);
        const hasInProfile = userSports.includes(sport.key_name);
        
        return {
          sportCategoryId: sport.id,
          sportName: sport.name,
          sportKeyName: sport.key_name,
          hasFullAccess: isPremium || isPurchased,
          hasDemoAccess: hasInProfile && !isPurchased && !isPremium,
          isPurchased,
          priceUsd: sport.price_usd,
          pricePln: sport.price_pln,
        };
      });

      setSportAccess(accessList);
    } catch (error) {
      console.error('Error fetching sport path access:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  const hasSportAccess = useCallback((sportKeyName: string): 'full' | 'demo' | 'none' => {
    if (isPremiumUser) return 'full';
    
    const sport = sportAccess.find(s => s.sportKeyName === sportKeyName);
    if (!sport) return 'none';
    
    if (sport.hasFullAccess) return 'full';
    if (sport.hasDemoAccess) return 'demo';
    return 'none';
  }, [sportAccess, isPremiumUser]);

  const canAccessLevel = useCallback((sportKeyName: string, isDemo: boolean): boolean => {
    if (isPremiumUser) return true;
    
    const access = hasSportAccess(sportKeyName);
    if (access === 'full') return true;
    if (access === 'demo' && isDemo) return true;
    return false;
  }, [hasSportAccess, isPremiumUser]);

  const getSportPrice = useCallback((sportKeyName: string, currency: 'usd' | 'pln' = 'usd'): number | null => {
    const sport = sportAccess.find(s => s.sportKeyName === sportKeyName);
    if (!sport) return null;
    return currency === 'pln' ? sport.pricePln : sport.priceUsd;
  }, [sportAccess]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchAccess();
  }, [fetchAccess]);

  return {
    sportAccess,
    purchases,
    isLoading,
    isPremiumUser,
    hasSportAccess,
    canAccessLevel,
    getSportPrice,
    refetch,
  };
};
