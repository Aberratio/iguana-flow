import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../NotFound';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderNotFound = () => {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  );
};

describe('NotFound', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('wyświetla komunikat 404 po polsku', () => {
    renderNotFound();
    
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Nie znaleziono strony')).toBeInTheDocument();
  });

  it('wyświetla opis błędu po polsku', () => {
    renderNotFound();
    
    expect(screen.getByText(/Ups! Strona, której szukasz, nie istnieje/)).toBeInTheDocument();
  });

  it('wyświetla przycisk "Strona główna"', () => {
    renderNotFound();
    
    const homeButton = screen.getByRole('button', { name: /strona główna/i });
    expect(homeButton).toBeInTheDocument();
  });

  it('wyświetla przycisk "Wróć"', () => {
    renderNotFound();
    
    const backButton = screen.getByRole('button', { name: /wróć/i });
    expect(backButton).toBeInTheDocument();
  });

  it('wyświetla link "skontaktuj się z nami"', () => {
    renderNotFound();
    
    const contactLink = screen.getByRole('link', { name: /skontaktuj się z nami/i });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', '/about-us');
  });

  it('ikona Search jest widoczna', () => {
    renderNotFound();
    
    // Search icon should be present in the component
    const container = document.querySelector('.lucide-search');
    expect(container).toBeInTheDocument();
  });

  it('nawiguje do strony głównej po kliknięciu przycisku', async () => {
    const user = userEvent.setup();
    renderNotFound();
    
    const homeButton = screen.getByRole('button', { name: /strona główna/i });
    await user.click(homeButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('nawiguje wstecz po kliknięciu "Wróć"', async () => {
    const user = userEvent.setup();
    renderNotFound();
    
    const backButton = screen.getByRole('button', { name: /wróć/i });
    await user.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
