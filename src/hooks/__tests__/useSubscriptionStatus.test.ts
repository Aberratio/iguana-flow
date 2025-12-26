import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSubscriptionStatus } from '../useSubscriptionStatus';

// Mock user
const mockUser = { id: 'test-user-id', email: 'test@example.com', role: 'free' };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}));

// Mock Supabase functions
const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

describe('useSubscriptionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dla niezalogowanego użytkownika', () => {
    it('zwraca subscribed=false', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscribed).toBe(false);
      expect(result.current.subscription_tier).toBe(null);
      expect(result.current.subscription_end).toBe(null);
    });
  });

  describe('dla zalogowanego użytkownika', () => {
    it('wywołuje edge function check-subscription', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockInvoke.mockResolvedValue({
        data: { subscribed: true, subscription_tier: 'premium', subscription_end: '2025-12-31' },
        error: null,
      });

      renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('check-subscription');
      });
    });

    it('zwraca dane subskrypcji z edge function', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockInvoke.mockResolvedValue({
        data: { subscribed: true, subscription_tier: 'premium', subscription_end: '2025-12-31' },
        error: null,
      });

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscribed).toBe(true);
      expect(result.current.subscription_tier).toBe('premium');
      expect(result.current.subscription_end).toBe('2025-12-31');
    });
  });

  describe('hasPremiumAccess', () => {
    it('hasPremiumAccess = true dla subscribed', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockInvoke.mockResolvedValue({
        data: { subscribed: true, subscription_tier: 'premium', subscription_end: '2025-12-31' },
        error: null,
      });

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPremiumAccess).toBe(true);
    });

    it('hasPremiumAccess = true dla roli premium', async () => {
      const premiumUser = { ...mockUser, role: 'premium' };
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: premiumUser } as any);
      
      mockInvoke.mockResolvedValue({
        data: { subscribed: false, subscription_tier: null, subscription_end: null },
        error: null,
      });

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPremiumAccess).toBe(true);
    });

    it('hasPremiumAccess = true dla roli trainer', async () => {
      const trainerUser = { ...mockUser, role: 'trainer' };
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: trainerUser } as any);
      
      mockInvoke.mockResolvedValue({
        data: { subscribed: false, subscription_tier: null, subscription_end: null },
        error: null,
      });

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPremiumAccess).toBe(true);
    });

    it('hasPremiumAccess = true dla roli admin', async () => {
      const adminUser = { ...mockUser, role: 'admin' };
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: adminUser } as any);
      
      mockInvoke.mockResolvedValue({
        data: { subscribed: false, subscription_tier: null, subscription_end: null },
        error: null,
      });

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPremiumAccess).toBe(true);
    });

    it('hasPremiumAccess = false dla roli free bez subskrypcji', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockInvoke.mockResolvedValue({
        data: { subscribed: false, subscription_tier: null, subscription_end: null },
        error: null,
      });

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPremiumAccess).toBe(false);
    });
  });

  describe('obsługa błędów', () => {
    it('zwraca domyślne wartości przy błędzie', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
      
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      const { result } = renderHook(() => useSubscriptionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscribed).toBe(false);
      expect(result.current.subscription_tier).toBe(null);
    });
  });
});
