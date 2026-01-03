import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.describe('Unauthenticated User', () => {
    test('should redirect to landing when accessing protected routes', async ({ page }) => {
      await page.goto('/feed');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('should redirect to landing when accessing profile', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('should redirect to landing when accessing challenges', async ({ page }) => {
      await page.goto('/challenges');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('should allow access to privacy policy', async ({ page }) => {
      await page.goto('/privacy-policy');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /Polityka Prywatności/i })).toBeVisible({ timeout: 10000 });
    });

    test('should allow access to terms of use', async ({ page }) => {
      await page.goto('/terms-of-use');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /Regulamin/i })).toBeVisible({ timeout: 10000 });
    });

    test('should allow access to about page', async ({ page }) => {
      await page.goto('/about-us');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/about-us', { timeout: 10000 });
    });
  });

    test('should display 404 page for unknown routes', async ({ page }) => {
      await page.goto('/non-existent-page-12345');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=404').or(page.locator('text=Nie znaleziono'))).toBeVisible({ timeout: 10000 });
    });
});
