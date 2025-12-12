import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthOperations } from '../useAuthOperations';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('useAuthOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should call signInWithPassword with correct credentials', async () => {
      (supabase.auth.signInWithPassword as Mock).mockResolvedValue({ error: null });
      (supabase.auth.getUser as Mock).mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } } 
      });
      (supabase.rpc as Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error on failed sign in', async () => {
      const mockError = new Error('Invalid credentials');
      (supabase.auth.signInWithPassword as Mock).mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuthOperations());

      await expect(
        act(async () => {
          await result.current.signIn('test@example.com', 'wrong-password');
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should update login tracking on successful sign in', async () => {
      (supabase.auth.signInWithPassword as Mock).mockResolvedValue({ error: null });
      (supabase.auth.getUser as Mock).mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } } 
      });
      (supabase.rpc as Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(supabase.rpc).toHaveBeenCalledWith('update_user_login_tracking', {
        user_id: 'test-user-id',
      });
    });

    it('should not throw if login tracking fails', async () => {
      (supabase.auth.signInWithPassword as Mock).mockResolvedValue({ error: null });
      (supabase.auth.getUser as Mock).mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } } 
      });
      (supabase.rpc as Mock).mockRejectedValue(new Error('RPC failed'));

      const { result } = renderHook(() => useAuthOperations());

      // Should not throw even if tracking fails
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });
  });

  describe('signUp', () => {
    it('should call signUp with correct data and username', async () => {
      const mockUser = { id: 'new-user-id', email: 'new@example.com' };
      const mockSession = { access_token: 'token' };
      
      (supabase.auth.signUp as Mock).mockResolvedValue({ 
        data: { user: mockUser, session: mockSession },
        error: null 
      });

      const { result } = renderHook(() => useAuthOperations());

      let response: any;
      await act(async () => {
        response = await result.current.signUp('new@example.com', 'password123', 'newuser');
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.stringContaining('/'),
          data: { username: 'newuser' },
        },
      });
      expect(response).toEqual({ user: mockUser, session: mockSession });
    });

    it('should throw error on failed sign up', async () => {
      const mockError = new Error('Email already exists');
      (supabase.auth.signUp as Mock).mockResolvedValue({ 
        data: {},
        error: mockError 
      });

      const { result } = renderHook(() => useAuthOperations());

      await expect(
        act(async () => {
          await result.current.signUp('existing@example.com', 'password123', 'user');
        })
      ).rejects.toThrow('Email already exists');
    });

    it('should include correct redirect URL', async () => {
      (supabase.auth.signUp as Mock).mockResolvedValue({ 
        data: { user: {}, session: {} },
        error: null 
      });

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.signUp('new@example.com', 'password123', 'newuser');
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            emailRedirectTo: expect.stringMatching(/^https?:\/\/.*\/$/)
          })
        })
      );
    });
  });

  describe('signOut', () => {
    it('should call signOut successfully', async () => {
      (supabase.auth.signOut as Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.signOut();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error on failed sign out', async () => {
      const mockError = new Error('Session expired');
      (supabase.auth.signOut as Mock).mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuthOperations());

      await expect(
        act(async () => {
          await result.current.signOut();
        })
      ).rejects.toThrow('Session expired');
    });
  });

  describe('backward compatibility aliases', () => {
    it('should have login alias for signIn', () => {
      const { result } = renderHook(() => useAuthOperations());
      expect(result.current.login).toBe(result.current.signIn);
    });

    it('should have register alias for signUp', () => {
      const { result } = renderHook(() => useAuthOperations());
      expect(result.current.register).toBe(result.current.signUp);
    });

    it('should have logout alias for signOut', () => {
      const { result } = renderHook(() => useAuthOperations());
      expect(result.current.logout).toBe(result.current.signOut);
    });
  });
});
