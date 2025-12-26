import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Inbox from '../Inbox';

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
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        or: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
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

const renderInbox = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Inbox />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Inbox', () => {
  it('wyświetla nagłówek "Powiadomienia"', () => {
    renderInbox();
    
    expect(screen.getByText('Powiadomienia')).toBeInTheDocument();
  });

  it('wyświetla filtry po polsku', () => {
    renderInbox();
    
    expect(screen.getByText('Wszystkie')).toBeInTheDocument();
    expect(screen.getByText('Polubienia')).toBeInTheDocument();
    expect(screen.getByText('Komentarze')).toBeInTheDocument();
    expect(screen.getByText('Znajomi')).toBeInTheDocument();
  });

  it('wyświetla empty state gdy brak powiadomień', async () => {
    renderInbox();
    
    // Wait for loading to finish
    const emptyState = await screen.findByText('Brak powiadomień');
    expect(emptyState).toBeInTheDocument();
  });

  it('wyświetla wskazówkę w empty state', async () => {
    renderInbox();
    
    const hint = await screen.findByText(/Polub posty innych/);
    expect(hint).toBeInTheDocument();
  });

  it('pozwala klikać w filtry', async () => {
    const user = userEvent.setup();
    renderInbox();
    
    const likesFilter = screen.getByText('Polubienia');
    await user.click(likesFilter);
    
    // Filter should be clickable and active
    expect(likesFilter).toBeInTheDocument();
  });

  it('wyświetla ikonę powiadomień w empty state', async () => {
    renderInbox();
    
    // Wait for loading to finish
    await screen.findByText('Brak powiadomień');
    
    // Bell icon should be present
    const bellIcon = document.querySelector('.lucide-bell');
    expect(bellIcon).toBeInTheDocument();
  });
});
