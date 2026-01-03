import type { Database } from '@/integrations/supabase/types';

/**
 * Helper types for extracting table types from Database
 */

// Extract Row type from a table
export type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

// Extract Insert type from a table
export type TableInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

// Extract Update type from a table
export type TableUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

/**
 * Common types used across services
 */

export interface ServiceError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  offset?: number;
  limit?: number;
}

/**
 * Common filter parameters
 */
export interface BaseFilters extends PaginationParams {
  search?: string;
  orderBy?: string;
  ascending?: boolean;
}

