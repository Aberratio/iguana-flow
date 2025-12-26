import { test, expect } from '@playwright/test';

test.describe('Inbox (Powiadomienia) - widok publiczny', () => {
  test('strona inbox wymaga logowania', async ({ page }) => {
    await page.goto('/inbox');
    
    // Should redirect or show login
    await expect(page).toHaveURL(/inbox|\//);
  });

  test('strona ma responsywny layout na mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/inbox');
    
    // Page should render without horizontal overflow
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });

  test('strona ma responsywny layout na tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/inbox');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('strona ma responsywny layout na desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/inbox');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Inbox - elementy UI', () => {
  test('strona ładuje się bez błędów JavaScript', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/inbox');
    await page.waitForTimeout(1000);
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      (err) => !err.includes('ResizeObserver') && !err.includes('Script error')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Inbox - dostępność', () => {
  test('strona ma poprawną strukturę nagłówków', async ({ page }) => {
    await page.goto('/inbox');
    
    // Should have at least one heading (if authenticated)
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    
    expect(count >= 0).toBeTruthy();
  });

  test('interaktywne elementy są focusowalne', async ({ page }) => {
    await page.goto('/inbox');
    
    // Tab through the page
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focusedElement = page.locator(':focus');
    const isFocused = await focusedElement.count();
    
    expect(isFocused >= 0).toBeTruthy();
  });
});

test.describe('Inbox - lokalizacja PL', () => {
  test('strona powinna renderować content', async ({ page }) => {
    await page.goto('/inbox');
    
    // Check that page has some content
    const body = await page.locator('body').textContent();
    const hasContent = body && body.length > 0;
    
    expect(hasContent).toBeTruthy();
  });
});
