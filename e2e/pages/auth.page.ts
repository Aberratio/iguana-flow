import { Page, Locator, expect } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly usernameInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly loginTab: Locator;
  readonly registerTab: Locator;
  readonly submitButton: Locator;
  readonly passwordToggle: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[role="dialog"]');
    this.emailInput = page.getByPlaceholder(/email/i).first();
    this.passwordInput = page.locator('input[name="password"]');
    this.usernameInput = page.getByPlaceholder(/nazwa użytkownika/i);
    this.confirmPasswordInput = page.getByPlaceholder(/potwierdź hasło/i);
    this.loginTab = page.getByRole('tab', { name: 'Zaloguj się' });
    this.registerTab = page.getByRole('tab', { name: 'Zarejestruj się' });
    this.submitButton = page.locator('button[type="submit"]');
    this.passwordToggle = page.locator('button').filter({ has: page.locator('svg') }).last();
    this.errorMessage = page.locator('[role="alert"]');
  }

  async fillLoginForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async fillRegisterForm(email: string, username: string, password: string) {
    await this.registerTab.click();
    await this.page.getByLabel('Email').fill(email);
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
  }

  async submitLogin() {
    await this.submitButton.filter({ hasText: 'Zaloguj się' }).click();
  }

  async submitRegister() {
    await this.submitButton.filter({ hasText: 'Utwórz konto' }).click();
  }

  async expectModalVisible() {
    await expect(this.modal).toBeVisible();
  }

  async expectModalHidden() {
    await expect(this.modal).not.toBeVisible();
  }

  async togglePasswordVisibility() {
    await this.passwordToggle.click();
  }
}
