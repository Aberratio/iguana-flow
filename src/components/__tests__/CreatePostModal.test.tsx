import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreatePostModal } from '../CreatePostModal';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    loading: false,
  }),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'new-post-id' }, error: null }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      }),
    },
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

const renderCreatePostModal = (isOpen = true) => {
  const queryClient = createTestQueryClient();
  const onClose = vi.fn();
  const onPostCreated = vi.fn();
  
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CreatePostModal isOpen={isOpen} onClose={onClose} onPostCreated={onPostCreated} />
        </MemoryRouter>
      </QueryClientProvider>
    ),
    onClose,
    onPostCreated,
  };
};

describe('CreatePostModal', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  it('wyświetla nagłówek "Utwórz post"', () => {
    renderCreatePostModal();
    
    expect(screen.getByText('Utwórz post')).toBeInTheDocument();
  });

  it('wyświetla pole tekstowe na treść', () => {
    renderCreatePostModal();
    
    const textarea = screen.getByPlaceholderText(/Co słychać/);
    expect(textarea).toBeInTheDocument();
  });

  it('wyświetla przycisk "Opublikuj"', () => {
    renderCreatePostModal();
    
    expect(screen.getByRole('button', { name: /opublikuj/i })).toBeInTheDocument();
  });

  it('wyświetla przycisk "Dodaj zdjęcie"', () => {
    renderCreatePostModal();
    
    expect(screen.getByText('Dodaj zdjęcie')).toBeInTheDocument();
  });

  it('pozwala wpisywać tekst', async () => {
    const user = userEvent.setup();
    renderCreatePostModal();
    
    const textarea = screen.getByPlaceholderText(/Co słychać/);
    await user.type(textarea, 'Mój nowy post');
    
    expect(textarea).toHaveValue('Mój nowy post');
  });

  it('nie renderuje się gdy isOpen=false', () => {
    renderCreatePostModal(false);
    
    expect(screen.queryByText('Utwórz post')).not.toBeInTheDocument();
  });

  it('wyświetla ikonę zdjęcia', () => {
    renderCreatePostModal();
    
    const imageIcon = document.querySelector('.lucide-image');
    expect(imageIcon).toBeInTheDocument();
  });
});
