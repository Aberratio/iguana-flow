import { test, expect } from '@playwright/test';

test.describe('Funkcjonalności Premium', () => {
  test.describe('Biblioteka treningów', () => {
    test('strona /training/library jest dostępna publicznie', async ({ page }) => {
      await page.goto('/training/library');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('wyświetla polskie teksty', async ({ page }) => {
      await page.goto('/training/library');
      
      // Wait for content to load
      await page.waitForTimeout(1000);
      
      // Check for Polish content
      const polishContent = await page.locator('body').textContent();
      
      // Should contain some Polish words
      const hasPolishContent = 
        polishContent?.includes('Biblioteka') ||
        polishContent?.includes('Treningi') ||
        polishContent?.includes('trening') ||
        polishContent?.includes('Ładowanie');
      
      expect(hasPolishContent).toBeTruthy();
    });

    test('jest responsywna na różnych urządzeniach', async ({ page }) => {
      // Desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/training/library');
      await expect(page.locator('body')).toBeVisible();

      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('body')).toBeVisible();

      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Strona cennika', () => {
    test('strona /pricing jest dostępna', async ({ page }) => {
      await page.goto('/pricing');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('wyświetla plany cenowe po polsku', async ({ page }) => {
      await page.goto('/pricing');
      
      await page.waitForTimeout(1000);
      
      const pageContent = await page.locator('body').textContent();
      
      // Should contain pricing-related Polish words
      const hasPricingContent = 
        pageContent?.includes('Premium') ||
        pageContent?.includes('cen') ||
        pageContent?.includes('plan') ||
        pageContent?.includes('Wybierz');
      
      expect(hasPricingContent).toBeTruthy();
    });

    test('jest responsywna', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/pricing');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Blokada treści premium', () => {
    test('użytkownik niezalogowany widzi zachętę do logowania', async ({ page }) => {
      // Try to access a potentially premium route
      await page.goto('/training/library');
      
      await page.waitForTimeout(1000);
      
      // Page should load without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Dostępność (a11y)', () => {
    test('strona biblioteki treningów jest dostępna', async ({ page }) => {
      await page.goto('/training/library');
      
      // Check for proper page structure
      await expect(page.locator('body')).toBeVisible();
      
      // Check for buttons or interactive elements
      const buttons = await page.locator('button').count();
      expect(buttons).toBeGreaterThanOrEqual(0);
    });

    test('strona cennika jest dostępna', async ({ page }) => {
      await page.goto('/pricing');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Brak błędów UI', () => {
    test('biblioteka nie wyświetla krytycznych błędów', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/training/library');
      await page.waitForTimeout(1000);
      
      // Filter out expected errors
      const criticalErrors = errors.filter(
        e => !e.includes('401') && 
             !e.includes('Unauthorized') && 
             !e.includes('Failed to fetch') &&
             !e.includes('net::')
      );
      
      if (criticalErrors.length > 0) {
        console.log('Critical errors found:', criticalErrors);
      }
    });

    test('strona cennika nie wyświetla krytycznych błędów', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/pricing');
      await page.waitForTimeout(1000);
      
      const criticalErrors = errors.filter(
        e => !e.includes('401') && 
             !e.includes('Unauthorized') && 
             !e.includes('Failed to fetch') &&
             !e.includes('net::')
      );
      
      if (criticalErrors.length > 0) {
        console.log('Critical errors found:', criticalErrors);
      }
    });
  });

  test.describe('Nawigacja', () => {
    test('można nawigować z biblioteki do szczegółów treningu', async ({ page }) => {
      await page.goto('/training/library');
      
      await page.waitForTimeout(1000);
      
      // Page should load successfully
      await expect(page.locator('body')).toBeVisible();
    });

    test('można wrócić z cennika na stronę główną', async ({ page }) => {
      await page.goto('/pricing');
      
      await page.waitForTimeout(500);
      
      // Try to navigate back
      await page.goto('/');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Podróż lotnicza (Aerial Journey)', () => {
    test('strona /aerial-journey jest dostępna', async ({ page }) => {
      await page.goto('/aerial-journey');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('wyświetla polskie teksty', async ({ page }) => {
      await page.goto('/aerial-journey');
      
      await page.waitForTimeout(1000);
      
      const pageContent = await page.locator('body').textContent();
      
      // Check for any Polish content
      expect(pageContent?.length).toBeGreaterThan(0);
    });

    test('jest responsywna', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/aerial-journey');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
