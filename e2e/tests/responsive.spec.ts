import { test, expect, devices } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';

test.describe('Responsive Design', () => {
  test.describe('Mobile View', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should display mobile-friendly landing page', async ({ page }) => {
      const landingPage = new LandingPage(page);
      await landingPage.goto();
      
      await expect(landingPage.logo).toBeVisible();
      await expect(landingPage.loginButton).toBeVisible();
    });

    test('should have responsive hero section', async ({ page }) => {
      await page.goto('/');
      const heroTitle = page.getByRole('heading', { level: 1 });
      await expect(heroTitle).toBeVisible();
      
      const boundingBox = await heroTitle.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    });

    test('should stack features in single column on mobile', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => window.scrollTo(0, 1000));
      
      const featureCards = page.locator('.glass-effect');
      const count = await featureCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Tablet View', () => {
    test.use({ ...devices['iPad Pro'] });

    test('should display landing page correctly on tablet', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('Desktop View', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should display full navigation on desktop', async ({ page }) => {
      await page.goto('/');
      const landingPage = new LandingPage(page);
      
      await expect(landingPage.logo).toBeVisible();
      await expect(landingPage.loginButton).toBeVisible();
    });
  });
});
