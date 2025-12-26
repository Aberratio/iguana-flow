import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNavigation from '../Layout/BottomNavigation';

// Mock useUserRole hook
const mockUseUserRole = vi.fn();
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => mockUseUserRole(),
}));

// Mock useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => true,
}));

const renderBottomNavigation = () => {
  return render(
    <MemoryRouter initialEntries={['/feed']}>
      <BottomNavigation />
    </MemoryRouter>
  );
};

describe('BottomNavigation', () => {
  beforeEach(() => {
    mockUseUserRole.mockReturnValue({
      isAdmin: false,
      isTrainer: false,
      isLoading: false,
    });
  });

  it('wyświetla podstawowe elementy nawigacji', () => {
    renderBottomNavigation();
    
    expect(screen.getByText('Podróż')).toBeInTheDocument();
    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText('Wyzwania')).toBeInTheDocument();
  });

  it('wyświetla linki dla zwykłego użytkownika', () => {
    renderBottomNavigation();
    
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  it('nie wyświetla zakładki Admin dla zwykłego użytkownika', () => {
    renderBottomNavigation();
    
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('nie wyświetla zakładki Trener dla zwykłego użytkownika', () => {
    renderBottomNavigation();
    
    expect(screen.queryByText('Trener')).not.toBeInTheDocument();
  });

  it('wyświetla zakładkę Admin dla administratora', () => {
    mockUseUserRole.mockReturnValue({
      isAdmin: true,
      isTrainer: false,
      isLoading: false,
    });
    
    renderBottomNavigation();
    
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('wyświetla zakładkę Trener dla trenera (nie admina)', () => {
    mockUseUserRole.mockReturnValue({
      isAdmin: false,
      isTrainer: true,
      isLoading: false,
    });
    
    renderBottomNavigation();
    
    expect(screen.getByText('Trener')).toBeInTheDocument();
  });

  it('nie wyświetla zakładki Trener dla admina', () => {
    mockUseUserRole.mockReturnValue({
      isAdmin: true,
      isTrainer: true,
      isLoading: false,
    });
    
    renderBottomNavigation();
    
    // Admin doesn't see Trener tab, only Admin tab
    expect(screen.queryByText('Trener')).not.toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('ma poprawne ścieżki dla linków', () => {
    renderBottomNavigation();
    
    const journeyLink = screen.getByRole('link', { name: /podróż/i });
    const feedLink = screen.getByRole('link', { name: /feed/i });
    const challengesLink = screen.getByRole('link', { name: /wyzwania/i });
    
    expect(journeyLink).toHaveAttribute('href', '/aerial-journey');
    expect(feedLink).toHaveAttribute('href', '/feed');
    expect(challengesLink).toHaveAttribute('href', '/challenges');
  });

  it('wyświetla odpowiednie ikony', () => {
    renderBottomNavigation();
    
    const planeIcon = document.querySelector('.lucide-plane');
    const messageIcon = document.querySelector('.lucide-message-square');
    const trophyIcon = document.querySelector('.lucide-trophy');
    
    expect(planeIcon).toBeInTheDocument();
    expect(messageIcon).toBeInTheDocument();
    expect(trophyIcon).toBeInTheDocument();
  });
});
