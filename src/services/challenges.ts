import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { TableRow, TableInsert, TableUpdate } from './types';
import { throwIfError } from './utils';

/**
 * Type definitions for challenges
 */

type ChallengeRow = TableRow<'challenges'>;
type ChallengeInsert = TableInsert<'challenges'>;
type ChallengeUpdate = TableUpdate<'challenges'>;

/**
 * Challenge with full details
 */
export interface ChallengeWithDetails extends ChallengeRow {
  // Additional computed fields can be added here
}

/**
 * Challenge filters
 */
export interface ChallengeFilters {
  search?: string;
  status?: string;
  type?: string;
  difficulty_level?: string;
  premium?: boolean;
  created_by?: string;
  limit?: number;
  offset?: number;
}

/**
 * Redeem challenge code response
 */
export interface RedeemChallengeCodeResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Fetch challenge by ID
 */
export const fetchChallengeById = async (id: string): Promise<ChallengeWithDetails> => {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  return throwIfError(data, error);
};

/**
 * Fetch challenges with filters
 */
export const fetchChallenges = async (
  filters: ChallengeFilters = {}
): Promise<ChallengeWithDetails[]> => {
  let query = supabase
    .from('challenges')
    .select('*')
    .is('deleted_at', null);

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.difficulty_level) {
    query = query.eq('difficulty_level', filters.difficulty_level);
  }

  if (filters.premium !== undefined) {
    query = query.eq('premium', filters.premium);
  }

  if (filters.created_by) {
    query = query.eq('created_by', filters.created_by);
  }

  query = query.order('created_at', { ascending: false });

  if (filters.limit) {
    const offset = filters.offset || 0;
    query = query.range(offset, offset + filters.limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

/**
 * Create a new challenge
 */
export const createChallenge = async (
  challengeData: ChallengeInsert
): Promise<ChallengeWithDetails> => {
  const { data, error } = await supabase
    .from('challenges')
    .insert(challengeData)
    .select()
    .single();

  return throwIfError(data, error);
};

/**
 * Update a challenge
 */
export const updateChallenge = async (
  id: string,
  challengeData: ChallengeUpdate
): Promise<ChallengeWithDetails> => {
  const { data, error } = await supabase
    .from('challenges')
    .update({
      ...challengeData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return throwIfError(data, error);
};

/**
 * Delete a challenge (soft delete)
 */
export const deleteChallenge = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('challenges')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

/**
 * Redeem challenge code using Edge Function
 */
export const redeemChallengeCode = async (
  challengeId: string,
  code: string
): Promise<RedeemChallengeCodeResponse> => {
  const { data, error } = await supabase.functions.invoke(
    'redeem-challenge-code',
    {
      body: {
        challengeId,
        code: code.trim(),
      },
    }
  );

  // Check if there's an error from Supabase client
  if (error) {
    // Try to extract error message from data if available
    let errorMessage = error.message;

    // If data exists and has error field, use that (Edge Function returned error in response body)
    if (data && typeof data === 'object' && 'error' in data && data.error) {
      errorMessage = data.error as string;
    }

    throw new Error(errorMessage || 'Nie udało się aktywować kodu');
  }

  // Check if data contains error (Edge Function returned error in success response)
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(data.error as string);
  }

  // Success case
  return {
    success: true,
    message: (data?.message as string) || 'Wyzwanie odblokowane pomyślnie!',
  };
};

