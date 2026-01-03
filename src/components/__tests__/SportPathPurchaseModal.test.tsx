import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SportPathPurchaseModal } from '../SportPathPurchaseModal';
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

const renderModal = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    sportCategoryId: 'sport-123',
    sportName: 'Aerial Hoop',
    pricePln: 4999,
    onSuccess: vi.fn(),
  };

  return render(
    <BrowserRouter>
      <SportPathPurchaseModal {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('SportPathPurchaseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderowanie', () => {
    it('wyświetla tytuł z nazwą sportu', () => {
      renderModal();
      expect(screen.getByText(/Wykup ścieżkę: Aerial Hoop/i)).toBeInTheDocument();
    });

    it('wyświetla zakładki Kup i Kod', () => {
      renderModal();
      expect(screen.getByRole('tab', { name: /Kup/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Kod/i })).toBeInTheDocument();
    });

    it('wyświetla cenę w PLN', () => {
      renderModal();
      expect(screen.getByText('49.99 zł')).toBeInTheDocument();
    });

    it('wyświetla korzyści', () => {
      renderModal();
      expect(screen.getByText('Wszystkie poziomy')).toBeInTheDocument();
      expect(screen.getByText('Wszystkie wyzwania')).toBeInTheDocument();
      expect(screen.getByText('Dożywotni dostęp')).toBeInTheDocument();
    });

    it('nie renderuje gdy isOpen=false', () => {
      renderModal({ isOpen: false });
      expect(screen.queryByText(/Wykup ścieżkę/i)).not.toBeInTheDocument();
    });
  });

  describe('Zakup', () => {
    it('przycisk Kup teraz wywołuje edge function', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke);
      mockInvoke.mockResolvedValueOnce({
        data: { url: 'https://stripe.com/checkout' },
        error: null,
      });

      // Mock window.open
      const mockOpen = vi.fn();
      vi.stubGlobal('open', mockOpen);

      renderModal();
      
      const buyButton = screen.getByRole('button', { name: /Kup teraz/i });
      await userEvent.click(buyButton);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('purchase-sport-path', {
          body: { sportCategoryId: 'sport-123', currency: 'pln' },
        });
      });

      expect(mockOpen).toHaveBeenCalledWith('https://stripe.com/checkout', '_blank');
    });

    it('pokazuje loader podczas ładowania', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke);
      mockInvoke.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderModal();
      
      const buyButton = screen.getByRole('button', { name: /Kup teraz/i });
      await userEvent.click(buyButton);

      expect(screen.getByText(/Przetwarzanie/i)).toBeInTheDocument();
    });

    it('wyświetla błąd gdy płatność nie udana', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke);
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Payment failed' },
      });

      renderModal();
      
      const buyButton = screen.getByRole('button', { name: /Kup teraz/i });
      await userEvent.click(buyButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Błąd',
            variant: 'destructive',
          })
        );
      });
    });

    it('przycisk jest wyłączony gdy brak ceny', () => {
      renderModal({ pricePln: null });
      
      const buyButton = screen.getByRole('button', { name: /Kup teraz/i });
      expect(buyButton).toBeDisabled();
    });
  });

  describe('Kod promocyjny', () => {
    it('wyświetla input na kod po przełączeniu zakładki', async () => {
      renderModal();
      
      const codeTab = screen.getByRole('tab', { name: /Kod/i });
      await userEvent.click(codeTab);

      expect(screen.getByPlaceholderText(/Wprowadź kod/i)).toBeInTheDocument();
    });

    it('waliduje pusty kod', async () => {
      renderModal();
      
      const codeTab = screen.getByRole('tab', { name: /Kod/i });
      await userEvent.click(codeTab);

      const redeemButton = screen.getByRole('button', { name: /Wykorzystaj kod/i });
      await userEvent.click(redeemButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Błąd',
            description: 'Wprowadź kod promocyjny',
            variant: 'destructive',
          })
        );
      });
    });

    it('wywołuje redeem-sport-code z kodem', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke);
      mockInvoke.mockResolvedValueOnce({
        data: { message: 'Success' },
        error: null,
      });

      const onSuccess = vi.fn();
      renderModal({ onSuccess });
      
      const codeTab = screen.getByRole('tab', { name: /Kod/i });
      await userEvent.click(codeTab);

      const input = screen.getByPlaceholderText(/Wprowadź kod/i);
      await userEvent.type(input, 'TESTCODE');

      const redeemButton = screen.getByRole('button', { name: /Wykorzystaj kod/i });
      await userEvent.click(redeemButton);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('redeem-sport-code', {
          body: { code: 'TESTCODE' },
        });
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sukces!',
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    it('konwertuje kod na wielkie litery', async () => {
      renderModal();
      
      const codeTab = screen.getByRole('tab', { name: /Kod/i });
      await userEvent.click(codeTab);

      const input = screen.getByPlaceholderText(/Wprowadź kod/i) as HTMLInputElement;
      await userEvent.type(input, 'testcode');

      expect(input.value).toBe('TESTCODE');
    });

    it('wyświetla błąd dla nieprawidłowego kodu', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke);
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid code' },
      });

      renderModal();
      
      const codeTab = screen.getByRole('tab', { name: /Kod/i });
      await userEvent.click(codeTab);

      const input = screen.getByPlaceholderText(/Wprowadź kod/i);
      await userEvent.type(input, 'BADCODE');

      const redeemButton = screen.getByRole('button', { name: /Wykorzystaj kod/i });
      await userEvent.click(redeemButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Błąd',
            variant: 'destructive',
          })
        );
      });
    });
  });
});
