import { supabase } from '@/integrations/supabase/client';
import type { TableRow } from './types';

/**
 * Admin statistics
 */
export interface AdminStats {
  users: {
    total: number;
    active: number;
    new: number;
    newToday: number;
    activeToday: number;
    loginData: Array<{ login_count: number | null }>;
  };
  challenges: {
    total: number;
    activeParticipants: number;
    completed: number;
  };
  posts: {
    total: number;
    thisWeek: number;
  };
  gallery: {
    total: number;
  };
  trainings: {
    total: number;
  };
  social: {
    friendships: number;
  };
  revenue: {
    orders: number;
    pendingOrders: number;
    revenue: number;
    redemptions: number;
  };
  progress: {
    figureCompletions: number;
  };
  library: {
    trainingLibraryCount: number;
  };
}

/**
 * Fetch admin dashboard statistics
 */
export const fetchAdminStats = async (): Promise<AdminStats> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: usersCount },
    { count: challengesCount },
    { count: postsCount },
    { count: galleryCount },
    { count: trainingsCount },
    { count: activeUsers },
    { count: newUsers },
    { count: newUsersToday },
    { count: activeToday },
    { data: loginData },
    { count: activeParticipants },
    { count: completedChallenges },
    { count: friendshipsCount },
    { count: postsThisWeek },
    { count: ordersCount },
    { count: pendingOrders },
    { data: revenueData },
    { count: redemptionsCount },
    { count: figureCompletions },
    { count: trainingLibraryCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('challenges').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('gallery_media').select('*', { count: 'exact', head: true }),
    supabase.from('training_courses').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_login_at', sevenDaysAgo),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_login_at', todayIso),
    supabase.from('profiles').select('login_count'),
    supabase.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('completed', true),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('amount').eq('status', 'completed'),
    supabase.from('challenge_redemption_codes').select('current_uses'),
    supabase.from('figure_progress').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('training_library').select('*', { count: 'exact', head: true }),
  ]);

  // Calculate revenue
  const revenue = (revenueData || []).reduce((sum: number, order: { amount: number | null }) => {
    return sum + (order.amount || 0);
  }, 0);

  // Calculate redemptions
  const redemptions = (redemptionsCount || []).reduce((sum: number, code: { current_uses: number | null }) => {
    return sum + (code.current_uses || 0);
  }, 0);

  return {
    users: {
      total: usersCount || 0,
      active: activeUsers || 0,
      new: newUsers || 0,
      newToday: newUsersToday || 0,
      activeToday: activeToday || 0,
      loginData: (loginData || []) as Array<{ login_count: number | null }>,
    },
    challenges: {
      total: challengesCount || 0,
      activeParticipants: activeParticipants || 0,
      completed: completedChallenges || 0,
    },
    posts: {
      total: postsCount || 0,
      thisWeek: postsThisWeek || 0,
    },
    gallery: {
      total: galleryCount || 0,
    },
    trainings: {
      total: trainingsCount || 0,
    },
    social: {
      friendships: friendshipsCount || 0,
    },
    revenue: {
      orders: ordersCount || 0,
      pendingOrders: pendingOrders || 0,
      revenue,
      redemptions,
    },
    progress: {
      figureCompletions: figureCompletions || 0,
    },
    library: {
      trainingLibraryCount: trainingLibraryCount || 0,
    },
  };
};

