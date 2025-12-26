import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminPanelModal } from '../Layout/AdminPanelModal';

const mockOnClose = vi.fn();
const mockOnImpersonateClick = vi.fn();

const renderAdminPanelModal = (isOpen = true) => {
  return render(
    <MemoryRouter>
      <AdminPanelModal
        isOpen={isOpen}
        onClose={mockOnClose}
        onImpersonateClick={mockOnImpersonateClick}
      />
    </MemoryRouter>
  );
};

describe('AdminPanelModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderowanie', () => {
    it('wyświetla tytuł "Panel Administratora"', () => {
      renderAdminPanelModal();
      
      expect(screen.getByText('Panel Administratora')).toBeInTheDocument();
    });

    it('nie renderuje się gdy isOpen=false', () => {
      renderAdminPanelModal(false);
      
      expect(screen.queryByText('Panel Administratora')).not.toBeInTheDocument();
    });
  });

  describe('sekcje accordion', () => {
    it('wyświetla sekcję "Zarządzanie treścią"', () => {
      renderAdminPanelModal();
      
      expect(screen.getByText('📝 Zarządzanie treścią')).toBeInTheDocument();
    });

    it('wyświetla sekcję "Zarządzanie użytkownikami"', () => {
      renderAdminPanelModal();
      
      expect(screen.getByText('👥 Zarządzanie użytkownikami')).toBeInTheDocument();
    });

    it('wyświetla sekcję "System"', () => {
      renderAdminPanelModal();
      
      expect(screen.getByText('⚙️ System')).toBeInTheDocument();
    });
  });

  describe('linki nawigacji', () => {
    it('zawiera link do edytora strony głównej', () => {
      renderAdminPanelModal();
      
      // Expand content section first
      fireEvent.click(screen.getByText('📝 Zarządzanie treścią'));
      
      expect(screen.getByText('Edytor strony głównej')).toBeInTheDocument();
    });

    it('zawiera link do osiągnięć', () => {
      renderAdminPanelModal();
      
      fireEvent.click(screen.getByText('📝 Zarządzanie treścią'));
      
      expect(screen.getByText('Osiągnięcia')).toBeInTheDocument();
    });

    it('zawiera link do zarządzania treningami', () => {
      renderAdminPanelModal();
      
      fireEvent.click(screen.getByText('📝 Zarządzanie treścią'));
      
      expect(screen.getByText('Zarządzanie treningami')).toBeInTheDocument();
    });

    it('zawiera link do ról użytkowników', () => {
      renderAdminPanelModal();
      
      fireEvent.click(screen.getByText('👥 Zarządzanie użytkownikami'));
      
      expect(screen.getByText('Role użytkowników')).toBeInTheDocument();
    });

    it('zawiera link do kodów promocyjnych', () => {
      renderAdminPanelModal();
      
      fireEvent.click(screen.getByText('⚙️ System'));
      
      expect(screen.getByText('Kody promocyjne')).toBeInTheDocument();
    });

    it('zawiera link do ustawień strony', () => {
      renderAdminPanelModal();
      
      fireEvent.click(screen.getByText('⚙️ System'));
      
      expect(screen.getByText('Ustawienia strony')).toBeInTheDocument();
    });
  });

  describe('przycisk impersonacji', () => {
    it('wyświetla opcję "Podszywanie się"', () => {
      renderAdminPanelModal();
      
      fireEvent.click(screen.getByText('👥 Zarządzanie użytkownikami'));
      
      expect(screen.getByText('Podszywanie się')).toBeInTheDocument();
    });

    it('wywołuje callback onImpersonateClick po kliknięciu', () => {
      renderAdminPanelModal();
      
      fireEvent.click(screen.getByText('👥 Zarządzanie użytkownikami'));
      
      const impersonateCard = screen.getByText('Podszywanie się').closest('[class*="cursor-pointer"]');
      if (impersonateCard) {
        fireEvent.click(impersonateCard);
      }
      
      expect(mockOnImpersonateClick).toHaveBeenCalled();
    });
  });

  describe('zamykanie modala', () => {
    it('zamyka modal po kliknięciu linka', () => {
      renderAdminPanelModal();
      
      fireEvent.click(screen.getByText('📝 Zarządzanie treścią'));
      
      const link = screen.getByText('Edytor strony głównej').closest('a');
      if (link) {
        fireEvent.click(link);
      }
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
