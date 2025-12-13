import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';
import { AuthPage } from '../pages/auth.page';

test.describe('Authentication', () => {
  let landingPage: LandingPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    authPage = new AuthPage(page);
    await landingPage.goto();
  });

  test.describe('Login Modal', () => {
    test.beforeEach(async () => {
      await landingPage.openLoginModal();
    });

    test('should switch between login and register tabs', async () => {
      await expect(authPage.loginTab).toHaveAttribute('data-state', 'active');
      
      await authPage.registerTab.click();
      await expect(authPage.registerTab).toHaveAttribute('data-state', 'active');
      await expect(authPage.usernameInput).toBeVisible();
      
      await authPage.loginTab.click();
      await expect(authPage.loginTab).toHaveAttribute('data-state', 'active');
    });

    test('should toggle password visibility', async () => {
      await authPage.emailInput.fill('test@example.com');
      await authPage.passwordInput.fill('secret123');
      
      await expect(authPage.passwordInput).toHaveAttribute('type', 'password');
      await authPage.togglePasswordVisibility();
      await expect(authPage.passwordInput).toHaveAttribute('type', 'text');
    });

    test('should require email and password for login', async () => {
      await authPage.submitLogin();
      await expect(authPage.modal).toBeVisible();
    });

    test('should close modal when pressing Escape', async ({ page }) => {
      await page.keyboard.press('Escape');
      await authPage.expectModalHidden();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await authPage.fillLoginForm('invalid@test.com', 'wrongpassword');
      await authPage.submitLogin();
      
      await expect(
        page.locator('text=Sign in failed').or(page.locator('text=Invalid')).or(page.locator('[data-sonner-toast]'))
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Registration Form', () => {
    test.beforeEach(async () => {
      await landingPage.openLoginModal();
      await authPage.registerTab.click();
    });

    test('should display all registration fields', async () => {
      await expect(authPage.page.getByLabel('Email')).toBeVisible();
      await expect(authPage.usernameInput).toBeVisible();
      await expect(authPage.passwordInput).toBeVisible();
      await expect(authPage.confirmPasswordInput).toBeVisible();
    });

    test('should validate password confirmation', async ({ page }) => {
      await authPage.page.getByLabel('Email').fill('newuser@test.com');
      await authPage.usernameInput.fill('newuser');
      await authPage.passwordInput.fill('password123');
      await authPage.confirmPasswordInput.fill('differentpassword');
      
      await authPage.submitRegister();
      
      await expect(page.locator('text=Hasła się nie zgadzają')).toBeVisible({ timeout: 5000 });
    });
  });
});
