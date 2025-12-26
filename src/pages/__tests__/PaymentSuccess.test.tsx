import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PaymentSuccess from '../PaymentSuccess';

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
          single: () => Promise.resolve({ data: { status: 'completed' }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
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

const renderPaymentSuccess = (searchParams = '') => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/payment-success${searchParams}`]}>
        <Routes>
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('PaymentSuccess', () => {
  it('wyświetla komunikat weryfikacji po polsku', () => {
    renderPaymentSuccess();
    
    expect(screen.getByText('Weryfikacja płatności...')).toBeInTheDocument();
  });

  it('wyświetla opis weryfikacji po polsku', () => {
    renderPaymentSuccess();
    
    expect(screen.getByText(/Proszę czekać, weryfikujemy płatność/)).toBeInTheDocument();
  });

  it('wyświetla animowany loader', () => {
    renderPaymentSuccess();
    
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('komponent renderuje się poprawnie', () => {
    const { container } = renderPaymentSuccess();
    
    expect(container).toBeInTheDocument();
  });
});
