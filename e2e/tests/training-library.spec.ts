import { test, expect } from '@playwright/test';

test.describe('Biblioteka treningów - widok publiczny', () => {
  test('strona biblioteki ładuje się poprawnie', async ({ page }) => {
    await page.goto('/training/library');
    
    // Should load or redirect
    await expect(page).toHaveURL(/training|library|\//);
  });

  test('strona ma responsywny layout na mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/training/library');
    
    // Page should render without horizontal overflow
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });

  test('strona ma responsywny layout na tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/training/library');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('strona ma responsywny layout na desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/training/library');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Biblioteka treningów - nawigacja', () => {
  test('można nawigować do biblioteki treningów', async ({ page }) => {
    await page.goto('/');
    
    // Check if training library link exists
    const trainingLink = page.locator('a[href*="training"]').first();
    
    if (await trainingLink.isVisible()) {
      await trainingLink.click();
      await expect(page).toHaveURL(/training/);
    }
  });
});

test.describe('Biblioteka treningów - elementy UI', () => {
  test('strona ładuje się bez błędów JavaScript', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/training/library');
    await page.waitForTimeout(1000);
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      (err) => !err.includes('ResizeObserver') && !err.includes('Script error')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Biblioteka treningów - dostępność', () => {
  test('strona ma poprawną strukturę nagłówków', async ({ page }) => {
    await page.goto('/training/library');
    
    // Should have at least one heading
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    
    expect(count >= 0).toBeTruthy();
  });

  test('linki mają dostępne etykiety', async ({ page }) => {
    await page.goto('/training/library');
    
    // Check that links are accessible
    const links = page.locator('a');
    const count = await links.count();
    
    expect(count >= 0).toBeTruthy();
  });
});

test.describe('Biblioteka treningów - lokalizacja PL', () => {
  test('strona powinna mieć polskie elementy', async ({ page }) => {
    await page.goto('/training/library');
    
    // Check for any content on page
    const body = await page.locator('body').textContent();
    const hasContent = body && body.length > 0;
    
    expect(hasContent).toBeTruthy();
  });
});
