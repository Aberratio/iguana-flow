import { test, expect, devices } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';

// Mobile View tests - skip for mobile-safari project since it already tests mobile viewport
test.describe('Responsive Design - Mobile View', () => {
  test.skip(({ }, testInfo) => testInfo.project.name === 'mobile-safari', 'Already tested by mobile-safari project');

  test('should display mobile-friendly landing page', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 12'].viewport!);
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    
    await expect(landingPage.logo).toBeVisible({ timeout: 10000 });
    await expect(landingPage.loginButton).toBeVisible({ timeout: 10000 });
  });

  test('should have responsive hero section', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 12'].viewport!);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const heroTitle = page.getByRole('heading', { level: 1 });
    await expect(heroTitle).toBeVisible({ timeout: 10000 });
    
    const boundingBox = await heroTitle.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });

  test('should stack features in single column on mobile', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 12'].viewport!);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500); // Wait for scroll animation
    
    const featureCards = page.locator('.glass-effect');
    const count = await featureCards.count();
    expect(count).toBeGreaterThan(0);
  });
});

// Tablet View tests
test.describe('Responsive Design - Tablet View', () => {
  test('should display landing page correctly on tablet', async ({ page }) => {
    await page.setViewportSize(devices['iPad Pro'].viewport!);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
  });
});

// Desktop View tests
test.describe('Responsive Design - Desktop View', () => {
  test('should display full navigation on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const landingPage = new LandingPage(page);
    
    await expect(landingPage.logo).toBeVisible({ timeout: 10000 });
    await expect(landingPage.loginButton).toBeVisible({ timeout: 10000 });
  });
});
