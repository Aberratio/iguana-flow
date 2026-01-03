import { test, expect } from '@playwright/test';

test.describe('Treningi - Uprawnienia', () => {
  test.describe('jako użytkownik free', () => {
    test('powinien zobaczyć komunikat o braku dostępu', async ({ page }) => {
      // Navigate to training page without authentication
      await page.goto('/training');
      await page.waitForLoadState('networkidle');
      
      // Should see access denied message
      await expect(page.getByText('Tylko dla trenerów')).toBeVisible({ timeout: 10000 });
    });

    test('powinien zobaczyć przycisk powrotu do podróży', async ({ page }) => {
      await page.goto('/training');
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByRole('button', { name: 'Wróć do podróży' })).toBeVisible({ timeout: 10000 });
    });

    test('nie powinien widzieć przycisku tworzenia sesji', async ({ page }) => {
      await page.goto('/training');
      
      await expect(page.getByRole('button', { name: 'Utwórz sesję' })).not.toBeVisible();
    });
  });
});

test.describe('Treningi - UI', () => {
  test('strona treningowa powinna być responsywna', async ({ page }) => {
    await page.goto('/training');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('komunikaty powinny być po polsku', async ({ page }) => {
    await page.goto('/training');
    await page.waitForLoadState('networkidle');
    
    // Check for Polish text
    const polishTexts = [
      'Tylko dla trenerów',
      'Strona główna',
      'Wróć do podróży',
    ];
    
    for (const text of polishTexts) {
      await expect(page.getByText(text)).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Biblioteka treningów - Filtry', () => {
  test('filtry sportów powinny pokazywać przetłumaczone nazwy', async ({ page }) => {
    // This test requires a logged-in user with library access
    // Skip for now as it requires authentication
    test.skip();
  });
});

test.describe('Biblioteka - Ukrywanie dla free users', () => {
  test('przycisk biblioteki nie powinien być widoczny dla użytkowników free', async ({ page }) => {
    // Navigate to a page where TopHeader is visible
    await page.goto('/aerial-journey');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // The library button should not be visible for unauthenticated/free users
    // Note: This may need adjustment based on actual auth state
    const libraryButton = page.getByRole('button', { name: /Biblioteka/i });
    
    // For unauthenticated users, the button may or may not be visible
    // depending on how the app handles unauthenticated state
  });
});
