import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { TableRow, TableInsert, TableUpdate } from './types';
import { throwIfError } from './utils';
import type { Json } from '@/integrations/supabase/types';

/**
 * Type definitions for training sessions
 */

type TrainingSessionRow = TableRow<'training_sessions'>;
type TrainingSessionInsert = TableInsert<'training_sessions'>;
type TrainingSessionUpdate = TableUpdate<'training_sessions'>;

/**
 * Session exercise structure (stored as JSON in training_sessions)
 */
export interface SessionExercise {
  id: string;
  name: string;
  sets?: number | null;
  reps?: number | null;
  hold_time_seconds?: number | null;
  rest_time_seconds?: number | null;
  play_video?: boolean | null;
  video_position?: string | null;
  notes?: string | null;
}

/**
 * Training session with categorized exercises
 */
export interface TrainingSessionWithExercises extends TrainingSessionRow {
  warmup_exercises: SessionExercise[];
  figures: SessionExercise[];
  stretching_exercises: SessionExercise[];
}

/**
 * Training session filters
 */
export interface TrainingSessionFilters {
  user_id?: string;
  published?: boolean;
  type?: string;
  difficulty_level?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch training session by ID
 */
export const fetchTrainingSession = async (
  id: string
): Promise<TrainingSessionWithExercises> => {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('id', id)
    .single();

  const session = throwIfError(data, error);

  return {
    ...session,
    warmup_exercises: (session.warmup_exercises as SessionExercise[]) || [],
    figures: (session.figures as SessionExercise[]) || [],
    stretching_exercises: (session.stretching_exercises as SessionExercise[]) || [],
  };
};

/**
 * Fetch training sessions with filters
 */
export const fetchTrainingSessions = async (
  filters: TrainingSessionFilters = {}
): Promise<TrainingSessionRow[]> => {
  let query = supabase
    .from('training_sessions')
    .select('*');

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters.published !== undefined) {
    query = query.eq('published', filters.published);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.difficulty_level) {
    query = query.eq('difficulty_level', filters.difficulty_level);
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
 * Create a new training session
 */
export const createTrainingSession = async (
  sessionData: TrainingSessionInsert
): Promise<TrainingSessionRow> => {
  const { data, error } = await supabase
    .from('training_sessions')
    .insert(sessionData)
    .select()
    .single();

  return throwIfError(data, error);
};

/**
 * Update a training session
 */
export const updateTrainingSession = async (
  id: string,
  sessionData: TrainingSessionUpdate
): Promise<TrainingSessionRow> => {
  const { data, error } = await supabase
    .from('training_sessions')
    .update({
      ...sessionData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return throwIfError(data, error);
};

/**
 * Delete a training session
 */
export const deleteTrainingSession = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Fetch session exercises (warmup, training, stretching)
 */
export const fetchSessionExercises = async (
  sessionId: string
): Promise<{
  warmup: SessionExercise[];
  training: SessionExercise[];
  stretching: SessionExercise[];
}> => {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('warmup_exercises, figures, stretching_exercises')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Session not found');

  return {
    warmup: (data.warmup_exercises as SessionExercise[]) || [],
    training: (data.figures as SessionExercise[]) || [],
    stretching: (data.stretching_exercises as SessionExercise[]) || [],
  };
};

