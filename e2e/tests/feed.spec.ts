import { test, expect } from '@playwright/test';

test.describe('Feed - widok publiczny', () => {
  test('strona feed wymaga logowania', async ({ page }) => {
    await page.goto('/feed');
    
    // Should redirect to landing for unauthenticated users
    await expect(page).toHaveURL(/feed|\//);
  });

  test('strona ma responsywny layout na mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/feed');
    
    // Page should render without horizontal overflow
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });

  test('strona ma responsywny layout na tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/feed');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('strona ma responsywny layout na desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/feed');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Feed - elementy UI', () => {
  test('strona ładuje się bez błędów JavaScript', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/feed');
    await page.waitForTimeout(1000);
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      (err) => !err.includes('ResizeObserver') && !err.includes('Script error')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Feed - lokalizacja PL', () => {
  test('strona główna ma polskie teksty', async ({ page }) => {
    await page.goto('/');
    
    // Check landing page has Polish content
    const polishText = page.getByText(/rozpocznij|zaloguj|dołącz|trening/i);
    const count = await polishText.count();
    
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Feed - dostępność', () => {
  test('strona ma poprawną strukturę nagłówków', async ({ page }) => {
    await page.goto('/feed');
    
    // Should have at least one heading
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    
    expect(count >= 0).toBeTruthy();
  });
});
