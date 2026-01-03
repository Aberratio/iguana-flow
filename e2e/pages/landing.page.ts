import { Page, Locator, expect } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly logo: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly heroTitle: Locator;
  readonly featuresSection: Locator;
  readonly footer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('img[alt="IguanaFlow Logo"]');
    this.loginButton = page.getByRole('button', { name: 'Zaloguj się' });
    this.registerButton = page.getByRole('button', { name: /Rozpocznij|Wchodzę w to/i });
    this.heroTitle = page.getByRole('heading', { level: 1 });
    this.featuresSection = page.locator('text=Wszystko czego potrzebujesz').first();
    this.footer = page.locator('footer');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(500); // Additional wait for mobile-safari
  }

  async openLoginModal() {
    await this.loginButton.click();
  }

  async openRegisterModal() {
    await this.registerButton.first().click();
  }

  async expectLogoVisible() {
    await expect(this.logo).toBeVisible({ timeout: 15000 });
  }

  async expectHeroVisible() {
    await expect(this.heroTitle).toBeVisible({ timeout: 15000 });
  }
}
