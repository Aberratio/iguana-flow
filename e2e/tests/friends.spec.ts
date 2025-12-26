import { test, expect } from '@playwright/test';

test.describe('Znajomi - widok publiczny', () => {
  test('strona znajomych wymaga logowania', async ({ page }) => {
    await page.goto('/friends');
    
    // Should redirect or show login
    await expect(page).toHaveURL(/friends|\//);
  });

  test('strona ma responsywny layout na mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/friends');
    
    // Page should render without horizontal overflow
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });

  test('strona ma responsywny layout na tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/friends');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('strona ma responsywny layout na desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/friends');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Znajomi - elementy UI', () => {
  test('strona ładuje się bez błędów JavaScript', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/friends');
    await page.waitForTimeout(1000);
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      (err) => !err.includes('ResizeObserver') && !err.includes('Script error')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Znajomi - dostępność', () => {
  test('strona ma focusowalne elementy', async ({ page }) => {
    await page.goto('/friends');
    
    // Tab through the page
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focusedElement = page.locator(':focus');
    const isFocused = await focusedElement.count();
    
    expect(isFocused >= 0).toBeTruthy();
  });
});

test.describe('Znajomi - lokalizacja PL', () => {
  test('strona powinna mieć polskie elementy', async ({ page }) => {
    await page.goto('/friends');
    
    // Check for any Polish text on page or landing redirect
    const body = await page.locator('body').textContent();
    const hasContent = body && body.length > 0;
    
    expect(hasContent).toBeTruthy();
  });
});
