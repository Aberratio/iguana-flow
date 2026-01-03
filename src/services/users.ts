import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { TableRow, TableInsert, TableUpdate } from './types';
import { throwIfError } from './utils';

/**
 * Type definitions for users/profiles
 */

type ProfileRow = TableRow<'profiles'>;
type ProfileInsert = TableInsert<'profiles'>;
type ProfileUpdate = TableUpdate<'profiles'>;

/**
 * User profile with full details
 */
export interface UserProfile extends ProfileRow {
  // Additional computed fields can be added here
}

/**
 * User statistics
 */
export interface UserStats {
  posts_count: number;
  challenges_count: number;
  training_sessions_count: number;
  followers_count: number;
  following_count: number;
}

/**
 * Fetch user profile by ID
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return throwIfError(data, error);
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  profileData: ProfileUpdate
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  return throwIfError(data, error);
};

/**
 * Fetch user statistics
 */
export const fetchUserStats = async (userId: string): Promise<UserStats> => {
  // Fetch posts count
  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Fetch challenges count (as participant)
  const { count: challengesCount } = await supabase
    .from('challenge_participants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Fetch training sessions count
  const { count: trainingSessionsCount } = await supabase
    .from('training_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Fetch followers count
  const { count: followersCount } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  // Fetch following count
  const { count: followingCount } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  return {
    posts_count: postsCount || 0,
    challenges_count: challengesCount || 0,
    training_sessions_count: trainingSessionsCount || 0,
    followers_count: followersCount || 0,
    following_count: followingCount || 0,
  };
};

