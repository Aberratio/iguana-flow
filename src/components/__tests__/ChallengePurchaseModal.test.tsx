import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChallengePurchaseModal from '../ChallengePurchaseModal';
import { BrowserRouter } from 'react-router-dom';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

import { supabase } from '@/integrations/supabase/client';

const mockChallenge = {
  id: 'challenge-123',
  title: 'Test Challenge',
  description: 'A premium challenge for testing',
  price_pln: 3999,
  price_usd: 999,
};

const renderModal = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    challenge: mockChallenge,
    onPurchaseSuccess: vi.fn(),
  };

  return render(
    <BrowserRouter>
      <ChallengePurchaseModal {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('ChallengePurchaseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderowanie', () => {
    it('wyświetla tytuł wyzwania', () => {
      renderModal();
      expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    });

    it('wyświetla badge Premium', () => {
      renderModal();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('wyświetla opis wyzwania', () => {
      renderModal();
      expect(screen.getByText('A premium challenge for testing')).toBeInTheDocument();
    });

    it('wyświetla cenę w PLN', () => {
      renderModal();
      expect(screen.getByText(/39/)).toBeInTheDocument();
      expect(screen.getByText(/zł/)).toBeInTheDocument();
    });

    it('wyświetla zakładki Kup i Użyj kodu', () => {
      renderModal();
      expect(screen.getByRole('tab', { name: /Kup/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Użyj kodu/i })).toBeInTheDocument();
    });

    it('nie renderuje gdy isOpen=false', () => {
      renderModal({ isOpen: false });
      expect(screen.queryByText('Test Challenge')).not.toBeInTheDocument();
    });

    it('wyświetla informację o dożywotnim dostępie', () => {
      renderModal();
      expect(screen.getByText(/dożywotni dostęp/i)).toBeInTheDocument();
    });

    it('wyświetla informację o bezpiecznych płatnościach', () => {
      renderModal();
      expect(screen.getByText(/Stripe/i)).toBeInTheDocument();
    });
  });

  describe('Zakup', () => {
    it('przycisk Kup wywołuje edge function', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke);
      mockInvoke.mockResolvedValueOnce({
        data: { url: 'https://stripe.com/checkout' },
        error: null,
      });

      const mockOpen = vi.fn();
      vi.stubGlobal('open', mockOpen);

      const onClose = vi.fn();
      renderModal({ onClose });
      
      const buyButton = screen.getByRole('button', { name: /Kup wyzwanie/i });
      await userEvent.click(buyButton);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('purchase-challenge', {
          body: { challengeId: 'challenge-123', currency: 'pln' },
        });
      });

      expect(mockOpen).toHaveBeenCalledWith('https://stripe.com/checkout', '_blank');
      expect(onClose).toHaveBeenCalled();
    });

    it('pokazuje loader podczas przetwarzania', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke);
      mockInvoke.mockImplementation(() => new Promise(() => {}));

      renderModal();
      
      const buyButton = screen.getByRole('button', { name: /Kup wyzwanie/i });
      await userEvent.click(buyButton);

      expect(screen.getByText(/Przetwarzanie/i)).toBeInTheDocument();
    });

    it('obsługuje błędy płatności', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke);
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Payment failed' },
      });

      renderModal();
      
      const buyButton = screen.getByRole('button', { name: /Kup wyzwanie/i });
      await userEvent.click(buyButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Kod aktywacyjny', () => {
    it('wyświetla input na kod po przełączeniu zakładki', async () => {
      renderModal();
      
      const codeTab = screen.getByRole('tab', { name: /Użyj kodu/i });
      await userEvent.click(codeTab);

      expect(screen.getByPlaceholderText(/Wpisz swój kod/i)).toBeInTheDocument();
    });

    it('waliduje pusty kod', async () => {
      renderModal();
      
      const codeTab = screen.getByRole('tab', { name: /Użyj kodu/i });
      await userEvent.click(codeTab);

      const redeemButton = screen.getByRole('button', { name: /Użyj kodu/i });
      await userEvent.click(redeemButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Błąd',
            description: 'Wpisz kod aktywacyjny',
            variant: 'destructive',
          })
        );
      });
    });

    it('wywołuje redeem-challenge-code z kodem', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke);
      mockInvoke.mockResolvedValueOnce({
        data: { message: 'Wyzwanie odblokowane!' },
        error: null,
      });

      const onPurchaseSuccess = vi.fn();
      renderModal({ onPurchaseSuccess });
      
      const codeTab = screen.getByRole('tab', { name: /Użyj kodu/i });
      await userEvent.click(codeTab);

      const input = screen.getByPlaceholderText(/Wpisz swój kod/i);
      await userEvent.type(input, 'TESTCODE');

      const redeemButton = screen.getByRole('button', { name: /Użyj kodu/i });
      await userEvent.click(redeemButton);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('redeem-challenge-code', {
          body: { challengeId: 'challenge-123', code: 'TESTCODE' },
        });
      });

      expect(onPurchaseSuccess).toHaveBeenCalled();
    });

    it('tłumaczy komunikaty błędów na polski', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke);
      mockInvoke.mockResolvedValueOnce({
        data: { error: 'Invalid or expired redemption code' },
        error: null,
      });

      renderModal();
      
      const codeTab = screen.getByRole('tab', { name: /Użyj kodu/i });
      await userEvent.click(codeTab);

      const input = screen.getByPlaceholderText(/Wpisz swój kod/i);
      await userEvent.type(input, 'BADCODE');

      const redeemButton = screen.getByRole('button', { name: /Użyj kodu/i });
      await userEvent.click(redeemButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Nieprawidłowy lub wygasły kod aktywacyjny',
          })
        );
      });
    });

    it('konwertuje kod na wielkie litery', async () => {
      renderModal();
      
      const codeTab = screen.getByRole('tab', { name: /Użyj kodu/i });
      await userEvent.click(codeTab);

      const input = screen.getByPlaceholderText(/Wpisz swój kod/i) as HTMLInputElement;
      await userEvent.type(input, 'testcode');

      expect(input.value).toBe('TESTCODE');
    });
  });
});
