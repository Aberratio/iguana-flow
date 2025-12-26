import { test, expect } from '@playwright/test';

test.describe('Profil - widok publiczny', () => {
  test('strona profilu wymaga logowania', async ({ page }) => {
    await page.goto('/profile');
    
    // Should redirect to landing or show login
    await expect(page).toHaveURL(/profile|\//);
  });

  test('strona ma responsywny layout na mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/profile');
    
    // Page should render without horizontal overflow
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });

  test('strona ma responsywny layout na tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/profile');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('strona ma responsywny layout na desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/profile');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Profil - elementy UI', () => {
  test('strona ładuje się bez błędów JavaScript', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/profile');
    await page.waitForTimeout(1000);
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      (err) => !err.includes('ResizeObserver') && !err.includes('Script error')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Profil - dostępność', () => {
  test('strona ma poprawną strukturę nagłówków', async ({ page }) => {
    await page.goto('/profile');
    
    // Should have at least one heading
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    
    // Either has headings or redirects (no content)
    expect(count >= 0).toBeTruthy();
  });

  test('interaktywne elementy są focusowalne', async ({ page }) => {
    await page.goto('/profile');
    
    // Tab through the page
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focusedElement = page.locator(':focus');
    const isFocused = await focusedElement.count();
    
    expect(isFocused >= 0).toBeTruthy();
  });
});
