import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PremiumLockScreen } from '../PremiumLockScreen';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderPremiumLockScreen = () => {
  return render(
    <MemoryRouter>
      <PremiumLockScreen />
    </MemoryRouter>
  );
};

describe('PremiumLockScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tekst po polsku', () => {
    it('wyświetla tytuł "Treść Premium"', () => {
      renderPremiumLockScreen();
      
      expect(screen.getByText('Treść Premium')).toBeInTheDocument();
    });

    it('wyświetla opis o treści premium', () => {
      renderPremiumLockScreen();
      
      expect(screen.getByText('Ten trening jest dostępny tylko dla użytkowników premium')).toBeInTheDocument();
    });

    it('wyświetla listę korzyści premium', () => {
      renderPremiumLockScreen();
      
      expect(screen.getByText('Nieograniczony dostęp do wszystkich treningów premium')).toBeInTheDocument();
      expect(screen.getByText('Spersonalizowane plany treningowe')).toBeInTheDocument();
      expect(screen.getByText('Dostęp do ekskluzywnych wyzwań')).toBeInTheDocument();
    });
  });

  describe('przyciski', () => {
    it('wyświetla przycisk "Zostań Premium"', () => {
      renderPremiumLockScreen();
      
      expect(screen.getByRole('button', { name: /Zostań Premium/i })).toBeInTheDocument();
    });

    it('wyświetla przycisk "Przeglądaj darmowe treningi"', () => {
      renderPremiumLockScreen();
      
      expect(screen.getByRole('button', { name: /Przeglądaj darmowe treningi/i })).toBeInTheDocument();
    });
  });

  describe('nawigacja', () => {
    it('nawiguje do /pricing po kliknięciu "Zostań Premium"', () => {
      renderPremiumLockScreen();
      
      const button = screen.getByRole('button', { name: /Zostań Premium/i });
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/pricing');
    });

    it('nawiguje do /training/library po kliknięciu "Przeglądaj darmowe treningi"', () => {
      renderPremiumLockScreen();
      
      const button = screen.getByRole('button', { name: /Przeglądaj darmowe treningi/i });
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/training/library');
    });
  });

  describe('ikony', () => {
    it('wyświetla ikonę kłódki', () => {
      renderPremiumLockScreen();
      
      // Lock icon should be present
      const lockContainer = document.querySelector('.w-20.h-20');
      expect(lockContainer).toBeTruthy();
    });

    it('wyświetla ikony check przy korzyściach', () => {
      renderPremiumLockScreen();
      
      // Should have 3 check icons for benefits
      const checkIcons = document.querySelectorAll('.text-primary.flex-shrink-0');
      expect(checkIcons.length).toBe(3);
    });
  });
});
