import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PaymentCancelled from '../PaymentCancelled';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderPaymentCancelled = () => {
  return render(
    <MemoryRouter>
      <PaymentCancelled />
    </MemoryRouter>
  );
};

describe('PaymentCancelled', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('wyświetla nagłówek "Płatność anulowana"', () => {
    renderPaymentCancelled();
    
    expect(screen.getByText('Płatność anulowana')).toBeInTheDocument();
  });

  it('wyświetla opis po polsku', () => {
    renderPaymentCancelled();
    
    expect(screen.getByText(/Płatność została anulowana/)).toBeInTheDocument();
    expect(screen.getByText(/Nie zostały pobrane żadne środki/)).toBeInTheDocument();
  });

  it('wyświetla przycisk "Wróć"', () => {
    renderPaymentCancelled();
    
    const backButton = screen.getByRole('button', { name: /wróć/i });
    expect(backButton).toBeInTheDocument();
  });

  it('wyświetla przycisk "Zobacz plany cenowe"', () => {
    renderPaymentCancelled();
    
    const pricingButton = screen.getByRole('button', { name: /zobacz plany cenowe/i });
    expect(pricingButton).toBeInTheDocument();
  });

  it('wyświetla przycisk "Przejdź do feed\'u"', () => {
    renderPaymentCancelled();
    
    const feedButton = screen.getByRole('button', { name: /przejdź do feed/i });
    expect(feedButton).toBeInTheDocument();
  });

  it('wyświetla ikonę X-circle', () => {
    renderPaymentCancelled();
    
    const icon = document.querySelector('.lucide-x-circle');
    expect(icon).toBeInTheDocument();
  });

  it('nawiguje wstecz po kliknięciu "Wróć"', async () => {
    const user = userEvent.setup();
    renderPaymentCancelled();
    
    const backButton = screen.getByRole('button', { name: /wróć/i });
    await user.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('nawiguje do /pricing po kliknięciu "Zobacz plany cenowe"', async () => {
    const user = userEvent.setup();
    renderPaymentCancelled();
    
    const pricingButton = screen.getByRole('button', { name: /zobacz plany cenowe/i });
    await user.click(pricingButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/pricing');
  });

  it('nawiguje do /feed po kliknięciu "Przejdź do feed\'u"', async () => {
    const user = userEvent.setup();
    renderPaymentCancelled();
    
    const feedButton = screen.getByRole('button', { name: /przejdź do feed/i });
    await user.click(feedButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/feed');
  });
});
