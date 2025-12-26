import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSportGuardian } from '../useSportGuardian';

// Mock user
const mockUser = { id: 'test-user-id', email: 'test@example.com' };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}));

// Mock Supabase
const mockSupabaseSelect = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: mockSupabaseSelect,
      })),
    })),
  },
}));

describe('useSportGuardian', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dla niezalogowanego użytkownika', () => {
    it('zwraca pustą listę', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);

      const { result } = renderHook(() => useSportGuardian());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.guardianships).toEqual([]);
      expect(result.current.hasAnyGuardianship).toBe(false);
    });
  });

  describe('dla zalogowanego użytkownika', () => {
    it('pobiera guardianships z bazy', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      const mockData = [
        {
          sport_category_id: 'sport-1',
          sport_categories: { id: 'sport-1', name: 'Pole Dance', key_name: 'pole-dance' },
        },
        {
          sport_category_id: 'sport-2',
          sport_categories: { id: 'sport-2', name: 'Aerial Hoop', key_name: 'aerial-hoop' },
        },
      ];
      
      mockSupabaseSelect.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useSportGuardian());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.guardianships).toHaveLength(2);
      expect(result.current.guardianships[0].sport_name).toBe('Pole Dance');
      expect(result.current.guardianships[0].sport_key).toBe('pole-dance');
    });

    it('hasAnyGuardianship = true gdy ma przypisany sport', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      const mockData = [
        {
          sport_category_id: 'sport-1',
          sport_categories: { id: 'sport-1', name: 'Pole Dance', key_name: 'pole-dance' },
        },
      ];
      
      mockSupabaseSelect.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useSportGuardian());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasAnyGuardianship).toBe(true);
    });

    it('hasAnyGuardianship = false gdy brak przypisanych sportów', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockSupabaseSelect.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSportGuardian());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasAnyGuardianship).toBe(false);
    });
  });

  describe('metody sprawdzania guardianship', () => {
    it('isGuardianOf sprawdza po ID kategorii', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      const mockData = [
        {
          sport_category_id: 'sport-1',
          sport_categories: { id: 'sport-1', name: 'Pole Dance', key_name: 'pole-dance' },
        },
      ];
      
      mockSupabaseSelect.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useSportGuardian());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isGuardianOf('sport-1')).toBe(true);
      expect(result.current.isGuardianOf('sport-2')).toBe(false);
    });

    it('isGuardianOfByKey sprawdza po kluczu sportu', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      const mockData = [
        {
          sport_category_id: 'sport-1',
          sport_categories: { id: 'sport-1', name: 'Pole Dance', key_name: 'pole-dance' },
        },
      ];
      
      mockSupabaseSelect.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useSportGuardian());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isGuardianOfByKey('pole-dance')).toBe(true);
      expect(result.current.isGuardianOfByKey('aerial-hoop')).toBe(false);
    });
  });

  describe('obsługa błędów', () => {
    it('ustawia error przy błędzie pobierania', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockSupabaseSelect.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const { result } = renderHook(() => useSportGuardian());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Database error');
      expect(result.current.guardianships).toEqual([]);
    });
  });
});
