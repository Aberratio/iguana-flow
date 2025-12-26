import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PremiumRoute from '../PremiumRoute';

// Mock hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user' } })),
}));

vi.mock('@/hooks/useSubscriptionStatus', () => ({
  useSubscriptionStatus: vi.fn(() => ({
    hasPremiumAccess: false,
    isLoading: false,
  })),
}));

// Mock PricingPlansModal
vi.mock('@/components/PricingPlansModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="pricing-modal">Pricing Modal</div> : null,
}));

const renderPremiumRoute = (children: React.ReactNode = <div>Premium Content</div>) => {
  return render(
    <MemoryRouter>
      <PremiumRoute>{children}</PremiumRoute>
    </MemoryRouter>
  );
};

describe('PremiumRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('stan ładowania', () => {
    it('pokazuje loader podczas sprawdzania', async () => {
      const { useSubscriptionStatus } = await import('@/hooks/useSubscriptionStatus');
      vi.mocked(useSubscriptionStatus).mockReturnValue({
        hasPremiumAccess: false,
        isLoading: true,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        checkSubscription: vi.fn(),
      });

      renderPremiumRoute();

      // Should show spinner
      const container = document.querySelector('.animate-spin');
      expect(container).toBeTruthy();
    });
  });

  describe('brak dostępu premium', () => {
    it('pokazuje PricingPlansModal gdy brak dostępu', async () => {
      const { useSubscriptionStatus } = await import('@/hooks/useSubscriptionStatus');
      vi.mocked(useSubscriptionStatus).mockReturnValue({
        hasPremiumAccess: false,
        isLoading: false,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        checkSubscription: vi.fn(),
      });

      renderPremiumRoute();

      expect(screen.getByTestId('pricing-modal')).toBeInTheDocument();
    });

    it('nie renderuje children gdy brak dostępu', async () => {
      const { useSubscriptionStatus } = await import('@/hooks/useSubscriptionStatus');
      vi.mocked(useSubscriptionStatus).mockReturnValue({
        hasPremiumAccess: false,
        isLoading: false,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        checkSubscription: vi.fn(),
      });

      renderPremiumRoute(<div>Premium Content</div>);

      expect(screen.queryByText('Premium Content')).not.toBeInTheDocument();
    });
  });

  describe('z dostępem premium', () => {
    it('renderuje children gdy ma dostęp premium', async () => {
      const { useSubscriptionStatus } = await import('@/hooks/useSubscriptionStatus');
      vi.mocked(useSubscriptionStatus).mockReturnValue({
        hasPremiumAccess: true,
        isLoading: false,
        subscribed: true,
        subscription_tier: 'premium',
        subscription_end: '2025-12-31',
        checkSubscription: vi.fn(),
      });

      renderPremiumRoute(<div>Premium Content</div>);

      expect(screen.getByText('Premium Content')).toBeInTheDocument();
    });

    it('nie pokazuje PricingPlansModal gdy ma dostęp', async () => {
      const { useSubscriptionStatus } = await import('@/hooks/useSubscriptionStatus');
      vi.mocked(useSubscriptionStatus).mockReturnValue({
        hasPremiumAccess: true,
        isLoading: false,
        subscribed: true,
        subscription_tier: 'premium',
        subscription_end: '2025-12-31',
        checkSubscription: vi.fn(),
      });

      renderPremiumRoute();

      expect(screen.queryByTestId('pricing-modal')).not.toBeInTheDocument();
    });
  });
});
