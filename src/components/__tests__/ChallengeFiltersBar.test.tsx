import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChallengeFiltersBar from '../ChallengeFiltersBar';
import { FilterStatus } from '@/hooks/useChallengeFilters';

describe('ChallengeFiltersBar', () => {
  const defaultProps = {
    filters: {
      status: [] as FilterStatus[],
    },
    activeFilterCount: 0,
    onToggleFilter: vi.fn(),
    onClearFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wyświetla etykietę "Filtruj:"', () => {
    render(<ChallengeFiltersBar {...defaultProps} />);
    
    expect(screen.getByText('Filtruj:')).toBeInTheDocument();
  });

  it('wyświetla wszystkie opcje statusu po polsku', () => {
    render(<ChallengeFiltersBar {...defaultProps} />);
    
    expect(screen.getByText('W trakcie')).toBeInTheDocument();
    expect(screen.getByText('Nierozpoczęte')).toBeInTheDocument();
    expect(screen.getByText('Ukończone')).toBeInTheDocument();
  });

  it('wywołuje onToggleFilter po kliknięciu filtra', async () => {
    const user = userEvent.setup();
    const onToggleFilter = vi.fn();
    
    render(<ChallengeFiltersBar {...defaultProps} onToggleFilter={onToggleFilter} />);
    
    await user.click(screen.getByText('W trakcie'));
    
    expect(onToggleFilter).toHaveBeenCalledWith('status', 'active');
  });

  it('wyświetla przycisk "Wyczyść" gdy są aktywne filtry', () => {
    render(<ChallengeFiltersBar {...defaultProps} activeFilterCount={1} />);
    
    expect(screen.getByText('Wyczyść')).toBeInTheDocument();
  });

  it('nie wyświetla przycisku "Wyczyść" gdy brak aktywnych filtrów', () => {
    render(<ChallengeFiltersBar {...defaultProps} activeFilterCount={0} />);
    
    expect(screen.queryByText('Wyczyść')).not.toBeInTheDocument();
  });

  it('wywołuje onClearFilters po kliknięciu "Wyczyść"', async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    
    render(
      <ChallengeFiltersBar 
        {...defaultProps} 
        activeFilterCount={1} 
        onClearFilters={onClearFilters} 
      />
    );
    
    await user.click(screen.getByText('Wyczyść'));
    
    expect(onClearFilters).toHaveBeenCalled();
  });

  it('wyróżnia aktywne filtry', () => {
    render(
      <ChallengeFiltersBar 
        {...defaultProps} 
        filters={{ status: ['active'] }} 
      />
    );
    
    const activeFilter = screen.getByText('W trakcie');
    expect(activeFilter.parentElement).toHaveClass('cursor-pointer');
  });

  it('obsługuje wielokrotne aktywne filtry', () => {
    render(
      <ChallengeFiltersBar 
        {...defaultProps} 
        filters={{ status: ['active', 'completed'] }} 
        activeFilterCount={2}
      />
    );
    
    expect(screen.getByText('Wyczyść')).toBeInTheDocument();
  });
});
