import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FriendInviteModal } from '../FriendInviteModal';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    loading: false,
  }),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        neq: () => ({
          ilike: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
          not: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
    }),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderFriendInviteModal = (isOpen = true) => {
  const queryClient = createTestQueryClient();
  const onClose = vi.fn();
  
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FriendInviteModal isOpen={isOpen} onClose={onClose} />
        </MemoryRouter>
      </QueryClientProvider>
    ),
    onClose,
  };
};

describe('FriendInviteModal', () => {
  it('wyświetla nagłówek "Znajdź znajomych"', () => {
    renderFriendInviteModal();
    
    expect(screen.getByText('Znajdź znajomych')).toBeInTheDocument();
  });

  it('wyświetla pole wyszukiwania z placeholderem po polsku', () => {
    renderFriendInviteModal();
    
    const searchInput = screen.getByPlaceholderText('Szukaj znajomych...');
    expect(searchInput).toBeInTheDocument();
  });

  it('wyświetla sekcję "Sugerowani dla Ciebie"', () => {
    renderFriendInviteModal();
    
    expect(screen.getByText('Sugerowani dla Ciebie')).toBeInTheDocument();
  });

  it('pozwala wpisywać tekst w pole wyszukiwania', async () => {
    const user = userEvent.setup();
    renderFriendInviteModal();
    
    const searchInput = screen.getByPlaceholderText('Szukaj znajomych...');
    await user.type(searchInput, 'Jan');
    
    expect(searchInput).toHaveValue('Jan');
  });

  it('nie renderuje się gdy isOpen=false', () => {
    renderFriendInviteModal(false);
    
    expect(screen.queryByText('Znajdź znajomych')).not.toBeInTheDocument();
  });

  it('wyświetla ikonę wyszukiwania', () => {
    renderFriendInviteModal();
    
    const searchIcon = document.querySelector('.lucide-search');
    expect(searchIcon).toBeInTheDocument();
  });
});
