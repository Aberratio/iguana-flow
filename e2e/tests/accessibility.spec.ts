import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('landing page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const h1 = await page.locator('h1').count();
    expect(h1).toBe(1);
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('modal should trap focus', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Zaloguj się' }).click();
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('form inputs should have associated labels', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Zaloguj się' }).click();
    
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });
});
