import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserRole } from '../useUserRole';

// Mock AuthContext
const mockUser = { id: 'test-user-id', email: 'test@example.com' };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}));

// Mock Supabase
const mockSupabaseSelect = vi.fn();
const mockSupabaseFrom = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: mockSupabaseSelect,
    })),
  })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockSupabaseFrom,
  },
}));

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('pobieranie roli', () => {
    it('zwraca null gdy użytkownik niezalogowany', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);

      const { result } = renderHook(() => useUserRole());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userRole).toBe(null);
    });

    it('pobiera rolę z tabeli user_roles', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockSupabaseSelect.mockResolvedValue({ data: { role: 'admin' }, error: null });

      const { result } = renderHook(() => useUserRole());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userRole).toBe('admin');
    });

    it('fallback do profiles gdy brak w user_roles', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      // First call to user_roles fails
      mockSupabaseSelect.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
      // Second call to profiles succeeds
      mockSupabaseSelect.mockResolvedValueOnce({ data: { role: 'premium' }, error: null });

      const { result } = renderHook(() => useUserRole());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('flagi ról', () => {
    it('isAdmin = true dla roli admin', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockSupabaseSelect.mockResolvedValue({ data: { role: 'admin' }, error: null });

      const { result } = renderHook(() => useUserRole());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isTrainer).toBe(false);
      expect(result.current.isPremium).toBe(false);
      expect(result.current.isFree).toBe(false);
    });

    it('isTrainer = true dla roli trainer', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockSupabaseSelect.mockResolvedValue({ data: { role: 'trainer' }, error: null });

      const { result } = renderHook(() => useUserRole());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isTrainer).toBe(true);
      expect(result.current.isAdmin).toBe(false);
    });

    it('isPremium = true dla roli premium', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockSupabaseSelect.mockResolvedValue({ data: { role: 'premium' }, error: null });

      const { result } = renderHook(() => useUserRole());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isPremium).toBe(true);
    });

    it('isFree = true dla roli free', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockSupabaseSelect.mockResolvedValue({ data: { role: 'free' }, error: null });

      const { result } = renderHook(() => useUserRole());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isFree).toBe(true);
    });
  });

  describe('uprawnienia', () => {
    it('canCreateChallenges = true dla trainer', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockSupabaseSelect.mockResolvedValue({ data: { role: 'trainer' }, error: null });

      const { result } = renderHook(() => useUserRole());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canCreateChallenges).toBe(true);
    });

    it('canCreateChallenges = true dla admin', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockSupabaseSelect.mockResolvedValue({ data: { role: 'admin' }, error: null });

      const { result } = renderHook(() => useUserRole());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canCreateChallenges).toBe(true);
    });

    it('canAccessLibrary = true dla premium/trainer/admin', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockSupabaseSelect.mockResolvedValue({ data: { role: 'premium' }, error: null });

      const { result } = renderHook(() => useUserRole());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canAccessLibrary).toBe(true);
    });

    it('canAccessLibrary = false dla free', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockSupabaseSelect.mockResolvedValue({ data: { role: 'free' }, error: null });

      const { result } = renderHook(() => useUserRole());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canAccessLibrary).toBe(false);
    });
  });
});
