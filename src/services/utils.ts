import type { PostgrestError } from '@supabase/supabase-js';
import type { ServiceError } from './types';

/**
 * Convert Supabase error to ServiceError
 */
export const handleSupabaseError = (error: PostgrestError | null): ServiceError => {
  if (!error) {
    return {
      message: 'Unknown error occurred',
      code: 'UNKNOWN',
    };
  }

  return {
    message: error.message || 'An error occurred',
    code: error.code || 'UNKNOWN',
    details: error.details,
  };
};

/**
 * Throw error if Supabase response has error
 */
export const throwIfError = <T>(data: T | null, error: PostgrestError | null): T => {
  if (error) {
    throw new Error(error.message || 'An error occurred');
  }
  
  if (data === null) {
    throw new Error('Data not found');
  }
  
  return data;
};

/**
 * Safe array mapping with null check
 */
export const safeMap = <T, R>(
  array: T[] | null | undefined,
  mapper: (item: T) => R
): R[] => {
  if (!array) return [];
  return array.map(mapper);
};

/**
 * Safe single item extraction
 */
export const safeSingle = <T>(item: T | null | undefined): T | null => {
  return item ?? null;
};

