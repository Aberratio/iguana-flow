import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TrainerPanelModal } from '../TrainerPanelModal';

const mockNavigate = vi.fn();
const mockOnClose = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useSportGuardian', () => ({
  useSportGuardian: vi.fn(() => ({
    hasAnyGuardianship: false,
    guardianships: [],
    isLoading: false,
    error: null,
    isGuardianOf: () => false,
    isGuardianOfByKey: () => false,
  })),
}));

const renderTrainerPanelModal = (isOpen = true) => {
  return render(
    <MemoryRouter>
      <TrainerPanelModal isOpen={isOpen} onClose={mockOnClose} />
    </MemoryRouter>
  );
};

describe('TrainerPanelModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderowanie', () => {
    it('wyświetla tytuł "Panel trenera" po polsku', () => {
      renderTrainerPanelModal();
      
      expect(screen.getByText('Panel trenera')).toBeInTheDocument();
    });

    it('nie renderuje się gdy isOpen=false', () => {
      renderTrainerPanelModal(false);
      
      expect(screen.queryByText('Panel trenera')).not.toBeInTheDocument();
    });
  });

  describe('główne akcje', () => {
    it('wyświetla "Moje wyzwania"', () => {
      renderTrainerPanelModal();
      
      expect(screen.getByText('Moje wyzwania')).toBeInTheDocument();
      expect(screen.getByText('Twórz i zarządzaj wyzwaniami')).toBeInTheDocument();
    });

    it('wyświetla "Moje treningi"', () => {
      renderTrainerPanelModal();
      
      expect(screen.getByText('Moje treningi')).toBeInTheDocument();
      expect(screen.getByText('Twórz i zarządzaj treningami')).toBeInTheDocument();
    });

    it('wyświetla "Moje ćwiczenia"', () => {
      renderTrainerPanelModal();
      
      expect(screen.getByText('Moje ćwiczenia')).toBeInTheDocument();
      expect(screen.getByText('Twórz i zarządzaj ćwiczeniami')).toBeInTheDocument();
    });
  });

  describe('szybkie akcje', () => {
    it('wyświetla nagłówek "Szybkie akcje"', () => {
      renderTrainerPanelModal();
      
      expect(screen.getByText('Szybkie akcje')).toBeInTheDocument();
    });

    it('wyświetla przycisk "Nowe wyzwanie"', () => {
      renderTrainerPanelModal();
      
      expect(screen.getByText('Nowe wyzwanie')).toBeInTheDocument();
    });

    it('wyświetla przycisk "Nowy trening"', () => {
      renderTrainerPanelModal();
      
      expect(screen.getByText('Nowy trening')).toBeInTheDocument();
    });

    it('wyświetla przycisk "Nowe ćwiczenie"', () => {
      renderTrainerPanelModal();
      
      expect(screen.getByText('Nowe ćwiczenie')).toBeInTheDocument();
    });
  });

  describe('wskazówka dla nowych trenerów', () => {
    it('wyświetla tekst wskazówki', () => {
      renderTrainerPanelModal();
      
      expect(screen.getByText('Wskazówka:')).toBeInTheDocument();
      expect(screen.getByText(/Zacznij od stworzenia ćwiczeń/)).toBeInTheDocument();
    });
  });

  describe('nawigacja', () => {
    it('nawiguje do /trainer/my-challenges po kliknięciu "Moje wyzwania"', () => {
      renderTrainerPanelModal();
      
      const button = screen.getByText('Moje wyzwania').closest('button');
      if (button) {
        fireEvent.click(button);
      }
      
      expect(mockNavigate).toHaveBeenCalledWith('/trainer/my-challenges');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('nawiguje do /trainer/my-trainings po kliknięciu "Moje treningi"', () => {
      renderTrainerPanelModal();
      
      const button = screen.getByText('Moje treningi').closest('button');
      if (button) {
        fireEvent.click(button);
      }
      
      expect(mockNavigate).toHaveBeenCalledWith('/trainer/my-trainings');
    });

    it('nawiguje do /challenges/create po kliknięciu "Nowe wyzwanie"', () => {
      renderTrainerPanelModal();
      
      const button = screen.getByText('Nowe wyzwanie').closest('button');
      if (button) {
        fireEvent.click(button);
      }
      
      expect(mockNavigate).toHaveBeenCalledWith('/challenges/create');
    });
  });

  describe('opiekun sportu', () => {
    it('nie wyświetla "Moje sporty" gdy brak guardianship', () => {
      renderTrainerPanelModal();
      
      expect(screen.queryByText('Moje sporty')).not.toBeInTheDocument();
    });

    it('wyświetla "Moje sporty" gdy ma guardianship', async () => {
      const { useSportGuardian } = await import('@/hooks/useSportGuardian');
      vi.mocked(useSportGuardian).mockReturnValue({
        hasAnyGuardianship: true,
        guardianships: [{ sport_category_id: '1', sport_name: 'Pole Dance', sport_key: 'pole-dance' }],
        isLoading: false,
        error: null,
        isGuardianOf: () => true,
        isGuardianOfByKey: () => true,
      });

      renderTrainerPanelModal();
      
      expect(screen.getByText('Moje sporty')).toBeInTheDocument();
      expect(screen.getByText('1 sport pod opieką')).toBeInTheDocument();
    });

    it('wyświetla poprawną liczbę sportów w formie mnogiej', async () => {
      const { useSportGuardian } = await import('@/hooks/useSportGuardian');
      vi.mocked(useSportGuardian).mockReturnValue({
        hasAnyGuardianship: true,
        guardianships: [
          { sport_category_id: '1', sport_name: 'Pole Dance', sport_key: 'pole-dance' },
          { sport_category_id: '2', sport_name: 'Aerial Hoop', sport_key: 'aerial-hoop' },
        ],
        isLoading: false,
        error: null,
        isGuardianOf: () => true,
        isGuardianOfByKey: () => true,
      });

      renderTrainerPanelModal();
      
      expect(screen.getByText('2 sporty pod opieką')).toBeInTheDocument();
    });
  });
});
