import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';
import { AuthPage } from '../pages/auth.page';

test.describe('Landing Page', () => {
  let landingPage: LandingPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    authPage = new AuthPage(page);
    await landingPage.goto();
  });

  test('should display logo and hero section', async () => {
    await landingPage.expectLogoVisible();
    await landingPage.expectHeroVisible();
  });

  test('should display header with navigation buttons', async () => {
    await expect(landingPage.loginButton).toBeVisible();
    await expect(landingPage.registerButton.first()).toBeVisible();
  });

  test('should open login modal when clicking login button', async () => {
    await landingPage.openLoginModal();
    await authPage.expectModalVisible();
    await expect(authPage.loginTab).toHaveAttribute('data-state', 'active');
  });

  test('should open register modal when clicking CTA button', async () => {
    await landingPage.openRegisterModal();
    await authPage.expectModalVisible();
    await expect(authPage.registerTab).toHaveAttribute('data-state', 'active');
  });

  test('should display features section when scrolled', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 800));
    await expect(landingPage.featuresSection).toBeInViewport();
  });

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/IguanaFlow/i);
  });

  test('should display social proof statistics', async ({ page }) => {
    await expect(page.locator('text=100%')).toBeVisible();
  });
});
