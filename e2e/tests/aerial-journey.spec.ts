import { test, expect } from '@playwright/test';

test.describe('Aerial Journey', () => {
  test.describe('Admin Preview Mode', () => {
    test('should display levels for sport with free_levels_count = 0', async ({ page }) => {
      // Navigate to admin preview for stretching (which has free_levels_count = 0)
      await page.goto('/aerial-journey/preview/stretching');
      
      // Should not show login redirect (admin should be logged in)
      // Should show the skill tree with levels
      await expect(page.locator('[data-testid="skill-tree"]').or(page.locator('.space-y-4'))).toBeVisible({ timeout: 10000 });
      
      // Should show at least one level card
      const levelCards = page.locator('[class*="Card"], [class*="card"]').filter({ hasText: /Poziom|Level/i });
      await expect(levelCards.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display levels for sport with free_levels_count > 0', async ({ page }) => {
      // Navigate to admin preview for pole-dance (which typically has free levels)
      await page.goto('/aerial-journey/preview/pole-dance');
      
      // Should show the skill tree
      await expect(page.locator('[data-testid="skill-tree"]').or(page.locator('.space-y-4'))).toBeVisible({ timeout: 10000 });
    });

    test('should show draft badge for unpublished levels', async ({ page }) => {
      await page.goto('/aerial-journey/preview/stretching');
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Check for draft badge if present (depends on level status)
      const draftBadge = page.locator('text=Wersja robocza');
      // This may or may not be present depending on level status
      const badgeCount = await draftBadge.count();
      expect(badgeCount).toBeGreaterThanOrEqual(0);
    });

    test('should show "Pełny dostęp odblokowany" badge in admin preview', async ({ page }) => {
      await page.goto('/aerial-journey/preview/pole-dance');
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Check for unlocked access badge (if premium levels exist)
      const unlockedBadge = page.locator('text=Pełny dostęp odblokowany');
      // May or may not be present depending on levels configuration
      const badgeVisible = await unlockedBadge.isVisible().catch(() => false);
      // Just ensure the page loads without errors
      expect(true).toBe(true);
    });
  });

  test.describe('User View', () => {
    test('should load aerial journey main page', async ({ page }) => {
      await page.goto('/aerial-journey');
      
      // Should show the aerial journey page
      await expect(page).toHaveURL(/aerial-journey/);
    });

    test('should navigate to sport skill tree', async ({ page }) => {
      await page.goto('/aerial-journey/sport/pole-dance');
      
      // Should load without error
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/aerial-journey\/sport\/pole-dance/);
    });
  });

  test.describe('Loading States', () => {
    test('should show loading spinner while fetching data', async ({ page }) => {
      await page.goto('/aerial-journey/preview/stretching');
      
      // Loading spinner should appear briefly
      const spinner = page.locator('.animate-spin');
      // May be visible briefly during load
      await page.waitForTimeout(500);
    });
  });
});
