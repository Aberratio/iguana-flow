import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { TableRow, TableInsert, TableUpdate } from './types';
import { throwIfError } from './utils';

/**
 * Type definitions for exercises
 */

type FigureRow = TableRow<'figures'>;
type FigureInsert = TableInsert<'figures'>;
type FigureUpdate = TableUpdate<'figures'>;

type TrainingDayExerciseRow = TableRow<'training_day_exercises'>;
type TrainingDayExerciseInsert = TableInsert<'training_day_exercises'>;
type TrainingDayExerciseUpdate = TableUpdate<'training_day_exercises'>;

/**
 * Exercise with full details
 */
export interface ExerciseWithDetails extends FigureRow {
  // Additional computed fields can be added here
}

/**
 * Training day exercise with figure relation
 */
export interface TrainingDayExerciseWithFigure extends TrainingDayExerciseRow {
  figure: {
    id: string;
    name: string;
    difficulty_level: string | null;
    category: string | null;
    image_url: string | null;
    video_url: string | null;
    instructions: string | null;
  };
}

/**
 * Exercise filters
 */
export interface ExerciseFilters {
  search?: string;
  difficulty_level?: string;
  category?: string;
  type?: string;
  sport_category_id?: string;
  premium?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Fetch exercise by ID
 */
export const fetchExerciseById = async (id: string): Promise<ExerciseWithDetails> => {
  const { data, error } = await supabase
    .from('figures')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  return throwIfError(data, error);
};

/**
 * Fetch exercises with filters
 */
export const fetchExercises = async (
  filters: ExerciseFilters = {}
): Promise<ExerciseWithDetails[]> => {
  let query = supabase
    .from('figures')
    .select('*')
    .is('deleted_at', null);

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (filters.difficulty_level) {
    query = query.eq('difficulty_level', filters.difficulty_level);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.sport_category_id) {
    query = query.eq('sport_category_id', filters.sport_category_id);
  }

  if (filters.premium !== undefined) {
    query = query.eq('premium', filters.premium);
  }

  query = query.order('name');

  if (filters.limit) {
    const offset = filters.offset || 0;
    query = query.range(offset, offset + filters.limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

/**
 * Create a new exercise
 */
export const createExercise = async (
  exerciseData: FigureInsert
): Promise<ExerciseWithDetails> => {
  const { data, error } = await supabase
    .from('figures')
    .insert(exerciseData)
    .select()
    .single();

  return throwIfError(data, error);
};

/**
 * Update an exercise
 */
export const updateExercise = async (
  id: string,
  exerciseData: FigureUpdate
): Promise<ExerciseWithDetails> => {
  const { data, error } = await supabase
    .from('figures')
    .update({
      ...exerciseData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return throwIfError(data, error);
};

/**
 * Delete an exercise (soft delete)
 */
export const deleteExercise = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('figures')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

/**
 * Add exercise to training day
 */
export const addExerciseToTrainingDay = async (
  trainingDayId: string,
  exerciseData: Omit<TrainingDayExerciseInsert, 'training_day_id'>
): Promise<TrainingDayExerciseWithFigure> => {
  // Get current max order_index for this training day
  const { data: existingExercises } = await supabase
    .from('training_day_exercises')
    .select('order_index')
    .eq('training_day_id', trainingDayId)
    .order('order_index', { ascending: false })
    .limit(1);

  const orderIndex = existingExercises && existingExercises.length > 0
    ? existingExercises[0].order_index + 1
    : 0;

  const { data, error } = await supabase
    .from('training_day_exercises')
    .insert({
      ...exerciseData,
      training_day_id: trainingDayId,
      order_index: exerciseData.order_index ?? orderIndex,
    })
    .select(`
      *,
      figure:figures (
        id,
        name,
        difficulty_level,
        category,
        image_url,
        video_url,
        instructions
      )
    `)
    .single();

  return throwIfError(data, error) as TrainingDayExerciseWithFigure;
};

/**
 * Update training day exercise
 */
export const updateTrainingDayExercise = async (
  id: string,
  exerciseData: TrainingDayExerciseUpdate
): Promise<TrainingDayExerciseWithFigure> => {
  const { data, error } = await supabase
    .from('training_day_exercises')
    .update(exerciseData)
    .eq('id', id)
    .select(`
      *,
      figure:figures (
        id,
        name,
        difficulty_level,
        category,
        image_url,
        video_url,
        instructions
      )
    `)
    .single();

  return throwIfError(data, error) as TrainingDayExerciseWithFigure;
};

/**
 * Delete training day exercise
 */
export const deleteTrainingDayExercise = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('training_day_exercises')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Fetch training day exercises
 */
export const fetchTrainingDayExercises = async (
  trainingDayId: string
): Promise<TrainingDayExerciseWithFigure[]> => {
  const { data, error } = await supabase
    .from('training_day_exercises')
    .select(`
      *,
      figure:figures (
        id,
        name,
        difficulty_level,
        category,
        image_url,
        video_url,
        instructions
      )
    `)
    .eq('training_day_id', trainingDayId)
    .order('order_index');

  if (error) throw error;
  return (data || []) as TrainingDayExerciseWithFigure[];
};

