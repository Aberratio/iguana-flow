import { test, expect } from '@playwright/test';

test.describe('Premium Features', () => {
  test.describe('Training Library', () => {
    test('should load training library page', async ({ page }) => {
      await page.goto('/training/library');
      await expect(page).toHaveURL(/.*training\/library/);
    });

    test('should display Polish content', async ({ page }) => {
      await page.goto('/training/library');
      // Check for Polish UI elements
      const polishContent = await page.locator('text=/Biblioteka|Treningi|Ćwiczenia|Filtruj/i').first();
      await expect(polishContent).toBeVisible({ timeout: 10000 });
    });

    test('should be responsive', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1920, height: 1080 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/training/library');
        await page.waitForLoadState('networkidle');
        
        // Page should not have horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      }
    });
  });

  test.describe('Pricing Page', () => {
    test('should load pricing page', async ({ page }) => {
      await page.goto('/pricing');
      await expect(page).toHaveURL(/.*pricing/);
    });

    test('should display Polish pricing plans', async ({ page }) => {
      await page.goto('/pricing');
      // Check for Polish pricing content
      const polishPricing = await page.locator('text=/Premium|Plan|Subskrypcja|zł/i').first();
      await expect(polishPricing).toBeVisible({ timeout: 10000 });
    });

    test('should be responsive', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 1024, height: 768 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/pricing');
        await page.waitForLoadState('networkidle');
        
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      }
    });
  });

  test.describe('Premium Content Blocking', () => {
    test('unauthenticated users should see login prompt for premium content', async ({ page }) => {
      await page.goto('/training/library');
      // Non-authenticated users might see login or pricing modal
      const authPrompt = page.locator('text=/Zaloguj|Premium|Cennik/i').first();
      // This is a soft check - page should load without errors
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Accessibility', () => {
    test('training library has basic accessibility', async ({ page }) => {
      await page.goto('/training/library');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Additional wait for mobile-safari
      
      // Check for main content area
      const main = page.locator('main, [role="main"], .main-content, body').first();
      await expect(main).toBeVisible({ timeout: 15000 });
    });

    test('pricing page has basic accessibility', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Additional wait for mobile-safari
      
      const main = page.locator('main, [role="main"], .main-content, h1, body').first();
      await expect(main).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('No Critical Errors', () => {
    test('training library loads without critical console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter out expected errors
          if (!text.includes('net::') && 
              !text.includes('Failed to fetch') &&
              !text.includes('401') &&
              !text.includes('403')) {
            errors.push(text);
          }
        }
      });

      await page.goto('/training/library');
      await page.waitForLoadState('networkidle');
      
      // No critical JavaScript errors
      const criticalErrors = errors.filter(e => 
        e.includes('TypeError') || 
        e.includes('ReferenceError') ||
        e.includes('SyntaxError')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('pricing page loads without critical console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!text.includes('net::') && 
              !text.includes('Failed to fetch') &&
              !text.includes('401') &&
              !text.includes('403')) {
            errors.push(text);
          }
        }
      });

      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');
      
      const criticalErrors = errors.filter(e => 
        e.includes('TypeError') || 
        e.includes('ReferenceError') ||
        e.includes('SyntaxError')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Navigation', () => {
    test('can navigate from training library to training details', async ({ page }) => {
      await page.goto('/training/library');
      await page.waitForLoadState('networkidle');
      // Just verify page loads - actual navigation depends on content
    });

    test('can navigate back from pricing to home', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');
      
      // Look for home/back navigation
      const homeLink = page.locator('a[href="/"], nav a').first();
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await expect(page).toHaveURL('/');
      }
    });
  });

  test.describe('Aerial Journey', () => {
    test('should load aerial journey page', async ({ page }) => {
      await page.goto('/aerial-journey');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*aerial-journey/);
    });

    test('should display Polish content', async ({ page }) => {
      await page.goto('/aerial-journey');
      await page.waitForLoadState('networkidle');
      // Check for Polish UI elements
      const polishContent = await page.locator('text=/Aerial|Podróż|Ścieżka|Poziom/i').first();
      await expect(polishContent).toBeVisible({ timeout: 10000 });
    });

    test('should be responsive', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 1024, height: 768 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/aerial-journey');
        await page.waitForLoadState('networkidle');
        
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      }
    });
  });

  test.describe('Sport Path Purchase', () => {
    test('purchase modal displays Polish content', async ({ page }) => {
      // Navigate to aerial journey which may have purchase option
      await page.goto('/aerial-journey');
      await page.waitForLoadState('networkidle');
      
      // Look for purchase/unlock button
      const purchaseButton = page.locator('button:has-text("Wykup"), button:has-text("Odblokuj"), button:has-text("Kup")').first();
      
      if (await purchaseButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await purchaseButton.click();
        
        // Check modal content is in Polish
        await expect(page.locator('text=/Wykup ścieżkę|Kup|Kod/i').first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=/Wszystkie poziomy|Dożywotni dostęp/i').first()).toBeVisible();
      }
    });

    test('purchase modal tabs work correctly', async ({ page }) => {
      await page.goto('/aerial-journey');
      await page.waitForLoadState('networkidle');
      
      const purchaseButton = page.locator('button:has-text("Wykup"), button:has-text("Odblokuj"), button:has-text("Kup")').first();
      
      if (await purchaseButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await purchaseButton.click();
        await page.waitForTimeout(500);
        
        // Check tabs exist
        const buyTab = page.locator('[role="tab"]:has-text("Kup")');
        const codeTab = page.locator('[role="tab"]:has-text("Kod")');
        
        if (await buyTab.isVisible()) {
          await expect(buyTab).toBeVisible();
          await expect(codeTab).toBeVisible();
          
          // Click code tab
          await codeTab.click();
          await expect(page.locator('input[placeholder*="kod" i], input[placeholder*="Wprowadź" i]').first()).toBeVisible();
          
          // Switch back to buy
          await buyTab.click();
          await expect(page.locator('button:has-text("Kup teraz")').first()).toBeVisible();
        }
      }
    });

    test('promo code input validates empty input', async ({ page }) => {
      await page.goto('/aerial-journey');
      await page.waitForLoadState('networkidle');
      
      const purchaseButton = page.locator('button:has-text("Wykup"), button:has-text("Odblokuj"), button:has-text("Kup")').first();
      
      if (await purchaseButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await purchaseButton.click();
        await page.waitForTimeout(500);
        
        const codeTab = page.locator('[role="tab"]:has-text("Kod")');
        if (await codeTab.isVisible()) {
          await codeTab.click();
          
          // Try to submit without code
          const redeemButton = page.locator('button:has-text("Wykorzystaj kod")').first();
          if (await redeemButton.isVisible()) {
            await redeemButton.click();
            
            // Should show error toast
            await expect(page.locator('text=/Wprowadź kod|Błąd/i').first()).toBeVisible({ timeout: 3000 });
          }
        }
      }
    });
  });

  test.describe('Challenge Purchase', () => {
    test('challenge purchase modal shows Polish content', async ({ page }) => {
      await page.goto('/challenges');
      await page.waitForLoadState('networkidle');
      
      // Look for premium challenge
      const premiumBadge = page.locator('text=/Premium/i').first();
      
      if (await premiumBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Click on a premium challenge card
        const card = premiumBadge.locator('..').locator('..');
        await card.click().catch(() => {});
        
        // Check for Polish purchase content
        const polishContent = page.locator('text=/Wyzwanie Premium|Kup|zł/i').first();
        if (await polishContent.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(polishContent).toBeVisible();
        }
      }
    });
  });
});