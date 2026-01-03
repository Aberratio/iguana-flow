# Testing Requirements

## Core Principle: Test Everything

**MANDATORY**: All code must have tests. No exceptions.

## 1. Test Coverage Requirements

### Minimum Coverage Standards
- **Unit Tests**: 100% coverage for utilities and pure functions
- **Hook Tests**: 100% coverage for custom hooks
- **Component Tests**: 80%+ coverage for React components
- **E2E Tests**: All critical user flows must be tested

**Coverage Goals:**
- Aim for 80%+ overall coverage
- Critical paths must have 100% coverage
- Edge cases must be tested
- Error paths must be tested

## 2. Unit Tests

### All Utility Functions Must Have Tests
**REQUIRED**: Every function in `src/lib/` must have tests.

**Test Location:**
- Tests in `src/lib/__tests__/`
- File naming: `utils.ts` → `utils.test.ts`

**Example:**
```typescript
// src/lib/utils.ts
export const cn = (...classes: (string | undefined | null)[]) => {
  return classes.filter(Boolean).join(' ');
};

// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });
});
```

**Test Structure:**
- Use `describe` blocks to group related tests
- Use descriptive test names: `should do something when condition`
- Follow AAA pattern: Arrange, Act, Assert
- Test edge cases and error conditions

## 3. Hook Tests

### All Custom Hooks Must Have Tests
**REQUIRED**: Every hook in `src/hooks/` must have tests.

**Test Location:**
- Tests in `src/hooks/__tests__/`
- File naming: `useCustomHook.ts` → `useCustomHook.test.ts`

**Testing Hooks with React Testing Library:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserRole } from '../useUserRole';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user role when user is authenticated', async () => {
    const { result } = renderHook(() => useUserRole(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userRole).toBeDefined();
  });

  it('should return null when user is not authenticated', async () => {
    // Test unauthenticated state
  });
});
```

**Hook Testing Patterns:**
- Test loading states
- Test error states
- Test return values
- Test side effects
- Test cleanup (useEffect cleanup)

## 4. Component Tests

### All React Components Must Have Tests
**REQUIRED**: Every component must have tests.

**Test Location:**
- Tests in `src/components/__tests__/` or `__tests__/` folder next to component
- File naming: `Button.tsx` → `Button.test.tsx`

**Component Test Example:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../ui/button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });
  });

  describe('interactions', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('should have correct role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
```

**Component Testing Best Practices:**
- Test user interactions (clicks, inputs)
- Test accessibility (roles, labels)
- Test responsive behavior
- Test loading and error states
- Test prop variations
- Use `screen` queries (getByRole, getByLabelText, etc.)
- Prefer `userEvent` over `fireEvent` for user interactions

**Testing Library Queries (Priority Order):**
1. `getByRole` - Most accessible
2. `getByLabelText` - For form inputs
3. `getByPlaceholderText` - For inputs
4. `getByText` - For visible text
5. `getByTestId` - Last resort

## 5. E2E Tests (Playwright)

### Critical User Flows Must Have E2E Tests
**REQUIRED**: All critical user journeys must be tested end-to-end.

**Test Location:**
- Tests in `e2e/tests/`
- File naming: `feature.spec.ts`

**E2E Test Example:**
```typescript
import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';
import { AuthPage } from '../pages/auth.page';

test.describe('Authentication Flow', () => {
  test('should allow user to sign in', async ({ page }) => {
    const landingPage = new LandingPage(page);
    const authPage = new AuthPage(page);

    await landingPage.goto();
    await landingPage.clickSignIn();
    
    await authPage.fillEmail('test@example.com');
    await authPage.fillPassword('password123');
    await authPage.clickSignIn();

    await expect(page).toHaveURL(/\/feed/);
  });
});
```

**E2E Testing Requirements:**
- Test complete user flows (not just individual pages)
- Test on multiple browsers (Chromium, Firefox, WebKit)
- Test responsive design (mobile, tablet, desktop)
- Test accessibility
- Use Page Object Model pattern
- Test error scenarios
- Test loading states

**Page Object Pattern:**
```typescript
// e2e/pages/auth.page.ts
import { Page, Locator } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
  }

  async goto() {
    await this.page.goto('/auth');
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickSignIn() {
    await this.signInButton.click();
  }
}
```

## 6. Test Structure and Organization

### File Organization
```
src/
├── components/
│   ├── Button.tsx
│   └── __tests__/
│       └── Button.test.tsx
├── hooks/
│   ├── useCustomHook.ts
│   └── __tests__/
│       └── useCustomHook.test.ts
└── lib/
    ├── utils.ts
    └── __tests__/
        └── utils.test.ts

e2e/
├── pages/
│   └── auth.page.ts
└── tests/
    └── auth.spec.ts
```

### Test Naming Conventions
- Test files: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`
- Describe blocks: Component/Function name
- Test cases: `should do something when condition`

**Example:**
```typescript
describe('Button', () => {
  describe('rendering', () => {
    it('should render with default props', () => {});
    it('should render children correctly', () => {});
  });

  describe('interactions', () => {
    it('should handle click events', () => {});
    it('should not trigger click when disabled', () => {});
  });
});
```

## 7. Mocking

### Mock External Dependencies
**REQUIRED**: Mock Supabase, API calls, and external services.

**MSW (Mock Service Worker) Setup:**
```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { supabaseUrl } from '@/integrations/supabase/client';

export const handlers = [
  http.get(`${supabaseUrl}/rest/v1/profiles`, () => {
    return HttpResponse.json([
      { id: '1', username: 'testuser' },
    ]);
  }),
];
```

**Mock Supabase in Tests:**
```typescript
import { vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      })),
    })),
  },
}));
```

## 8. Test Execution

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/lib/__tests__/utils.test.ts

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### Pre-Commit Testing
**MANDATORY**: Run tests before committing.

```bash
# Before commit checklist
npm test              # Unit and component tests
npm run test:coverage # Check coverage
npm run lint          # Linting
npm run test:e2e      # E2E tests (if changed critical flows)
```

## 9. Test Quality Standards

### Test Requirements
- **Fast**: Tests should run quickly
- **Isolated**: Tests should not depend on each other
- **Repeatable**: Tests should produce same results every time
- **Self-validating**: Tests should clearly pass or fail
- **Timely**: Tests should be written before or alongside code

### What to Test
✅ **DO Test:**
- User interactions
- Business logic
- Edge cases
- Error handling
- Loading states
- Accessibility
- Component rendering

❌ **DON'T Test:**
- Implementation details
- Third-party library internals
- Framework behavior (React, etc.)
- Things that don't affect user experience

### Test Coverage
- Test happy paths
- Test error paths
- Test edge cases (empty data, null values, etc.)
- Test boundary conditions
- Test user interactions

## 10. Testing Checklist

Before considering code complete:

- [ ] Unit tests written for all utility functions
- [ ] Hook tests written for all custom hooks
- [ ] Component tests written for all components
- [ ] E2E tests written for critical user flows
- [ ] Tests pass locally
- [ ] Coverage meets minimum requirements (80%+)
- [ ] Edge cases tested
- [ ] Error handling tested
- [ ] Accessibility tested (for UI components)
- [ ] Tests are fast and isolated

## References

- Testing guide: `docs/TESTING.md`
- Test examples: `src/components/__tests__/Button.test.tsx`, `src/lib/__tests__/utils.test.ts`
- E2E tests: `e2e/tests/`
- Test setup: `src/test/setup.ts`, `vitest.config.ts`, `playwright.config.ts`

