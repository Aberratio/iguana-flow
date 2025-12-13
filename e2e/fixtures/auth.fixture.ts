import { test as base, expect } from '@playwright/test';

type AuthFixture = {
  authenticatedPage: void;
};

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page, context }, use) => {
    // Placeholder for authentication fixture
    // To be implemented when auth storage state is needed
    await use();
  },
});

export { expect };
