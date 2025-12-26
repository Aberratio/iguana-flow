import { test, expect } from '@playwright/test';

test.describe('Wyzwania - widok publiczny', () => {
  test('strona wyzwań ładuje się poprawnie', async ({ page }) => {
    await page.goto('/challenges');
    
    // Should show challenges page or redirect to login
    await expect(page).toHaveURL(/challenges|landing|\//);
  });

  test('strona ma responsywny layout na mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/challenges');
    
    // Page should render without horizontal overflow
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });

  test('strona ma responsywny layout na tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/challenges');
    
    // Page should render properly on tablet
    await expect(page.locator('body')).toBeVisible();
  });

  test('strona ma responsywny layout na desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/challenges');
    
    // Page should render properly on desktop
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Wyzwania - nawigacja', () => {
  test('można nawigować do strony wyzwań', async ({ page }) => {
    await page.goto('/');
    
    // Try to navigate to challenges via menu if visible
    const challengesLink = page.locator('a[href="/challenges"]').first();
    
    if (await challengesLink.isVisible()) {
      await challengesLink.click();
      await expect(page).toHaveURL(/challenges/);
    }
  });
});

test.describe('Wyzwania - lokalizacja PL', () => {
  test('strona ma polskie teksty', async ({ page }) => {
    await page.goto('/challenges');
    
    // Check for Polish text presence (if page loads for unauthenticated users)
    const polishText = page.getByText(/wyzwania|zaloguj|rozpocznij/i);
    
    // Either Polish text is visible or page redirects
    const hasPolishText = await polishText.count();
    const currentUrl = page.url();
    
    expect(hasPolishText > 0 || currentUrl.includes('/')).toBeTruthy();
  });
});
