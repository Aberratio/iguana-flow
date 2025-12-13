# Testing Guide

This document describes the testing setup, conventions, and best practices for this project.

## Table of Contents

- [Overview](#overview)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing New Tests](#writing-new-tests)
- [Conventions](#conventions)
- [Mocking](#mocking)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project uses the following testing stack:

| Tool | Purpose |
|------|---------|
| [Vitest](https://vitest.dev/) | Test runner (Jest-compatible, Vite-native) |
| [React Testing Library](https://testing-library.com/react) | Component testing utilities |
| [MSW (Mock Service Worker)](https://mswjs.io/) | API mocking |
| [jsdom](https://github.com/jsdom/jsdom) | Browser environment simulation |

---

## Running Tests

### Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended during development)
npm test -- --watch

# Run tests with UI dashboard
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- src/lib/__tests__/utils.test.ts

# Run tests matching a pattern
npm test -- --grep "isDayLocked"
```

### When to Run Tests

| Scenario | Command |
|----------|---------|
| During development | `npm test -- --watch` |
| Before committing | `npm test` |
| Before PR/merge | `npm run test:coverage` |
| Debugging specific test | `npm test -- path/to/file.test.ts` |

---

## Test Structure

### Directory Layout

```
src/
├── components/
│   ├── ui/
│   │   └── button.tsx
│   └── __tests__/
│       └── Button.test.tsx          # Component tests
├── hooks/
│   ├── useAuthOperations.ts
│   └── __tests__/
│       └── useAuthOperations.test.ts # Hook tests
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts             # Utility function tests
└── test/
    ├── setup.ts                      # Global test setup
    └── mocks/
        ├── handlers.ts               # MSW request handlers
        └── server.ts                 # MSW server instance
```

### File Naming

- Test files: `*.test.ts` or `*.test.tsx`
- Place tests in `__tests__/` folder next to source files
- Name test files after the module they test: `utils.ts` → `utils.test.ts`

---

## Writing New Tests

### Basic Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ModuleName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('functionName', () => {
    it('should do something when given valid input', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      expect(functionName(null)).toBe('default');
    });
  });
});
```

### Testing React Components

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Hello" />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<MyComponent onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should update state on input change', async () => {
    const user = userEvent.setup();
    
    render(<MyComponent />);
    
    await user.type(screen.getByRole('textbox'), 'test value');
    
    expect(screen.getByRole('textbox')).toHaveValue('test value');
  });
});
```

### Testing Custom Hooks

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useMyHook());

    expect(result.current.value).toBe(0);
  });

  it('should update state when action is called', async () => {
    const { result } = renderHook(() => useMyHook());

    await act(async () => {
      await result.current.increment();
    });

    expect(result.current.value).toBe(1);
  });
});
```

### Testing with React Query

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyQuery } from '../useMyQuery';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useMyQuery', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() => useMyQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(expectedData);
  });
});
```

---

## Conventions

### Describe Block Naming

```typescript
// ✅ Good - clear hierarchy
describe('AuthService', () => {
  describe('signIn', () => {
    it('should authenticate user with valid credentials', () => {});
    it('should throw error with invalid password', () => {});
  });
});

// ❌ Bad - flat structure, unclear grouping
describe('AuthService signIn should authenticate', () => {});
describe('AuthService signIn should throw error', () => {});
```

### Test Case Naming

```typescript
// ✅ Good - describes behavior and condition
it('should return null when user is not found', () => {});
it('should throw ValidationError when email is invalid', () => {});

// ❌ Bad - vague or implementation-focused
it('works', () => {});
it('tests the function', () => {});
it('calls the API', () => {});
```

### AAA Pattern (Arrange-Act-Assert)

```typescript
it('should calculate total with discount', () => {
  // Arrange - set up test data
  const items = [{ price: 100 }, { price: 50 }];
  const discount = 0.1;

  // Act - perform the action
  const result = calculateTotal(items, discount);

  // Assert - verify the result
  expect(result).toBe(135);
});
```

### One Assertion Per Concept

```typescript
// ✅ Good - focused assertions
it('should return user data', () => {
  const user = getUser('123');
  expect(user.id).toBe('123');
  expect(user.email).toBe('test@example.com');
});

it('should set user as active', () => {
  const user = getUser('123');
  expect(user.isActive).toBe(true);
});

// ❌ Bad - testing unrelated things
it('should work', () => {
  expect(getUser('123').id).toBe('123');
  expect(formatDate(new Date())).toBe('2024-01-01');
  expect(validateEmail('test')).toBe(false);
});
```

---

## Mocking

### Mocking Modules

```typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Mock specific export
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils');
  return {
    ...actual,
    formatDate: vi.fn(() => 'mocked-date'),
  };
});
```

### Mocking API Calls with MSW

Add new handlers in `src/test/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET request
  http.get('*/rest/v1/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ]);
  }),

  // POST request with body
  http.post('*/rest/v1/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: '3', ...body }, { status: 201 });
  }),

  // Error response
  http.get('*/rest/v1/error', () => {
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }),

  // Dynamic params
  http.get('*/rest/v1/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'User' });
  }),
];
```

### Mocking Functions

```typescript
import { vi } from 'vitest';

// Create mock function
const mockFn = vi.fn();

// With return value
mockFn.mockReturnValue('result');

// With implementation
mockFn.mockImplementation((x) => x * 2);

// With resolved promise
mockFn.mockResolvedValue({ data: 'result' });

// With rejected promise
mockFn.mockRejectedValue(new Error('Failed'));

// Verify calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Mocking Timers

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('should debounce calls', () => {
  const callback = vi.fn();
  const debounced = debounce(callback, 100);

  debounced();
  debounced();
  debounced();

  expect(callback).not.toHaveBeenCalled();

  vi.advanceTimersByTime(100);

  expect(callback).toHaveBeenCalledTimes(1);
});
```

---

## Best Practices

### DO ✅

1. **Test behavior, not implementation**
   ```typescript
   // ✅ Test what the user sees
   expect(screen.getByText('Welcome, John')).toBeInTheDocument();
   
   // ❌ Don't test internal state
   expect(component.state.userName).toBe('John');
   ```

2. **Use realistic test data**
   ```typescript
   // ✅ Realistic
   const user = { id: 'usr_123', email: 'john@example.com', name: 'John Doe' };
   
   // ❌ Lazy
   const user = { id: '1', email: 'a@b.c', name: 'x' };
   ```

3. **Test edge cases**
   ```typescript
   describe('formatPrice', () => {
     it('should format regular price', () => {});
     it('should handle zero', () => {});
     it('should handle negative values', () => {});
     it('should handle null/undefined', () => {});
     it('should handle very large numbers', () => {});
   });
   ```

4. **Keep tests independent**
   ```typescript
   // ✅ Each test sets up its own data
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

5. **Use semantic queries**
   ```typescript
   // ✅ Accessible queries (in order of preference)
   screen.getByRole('button', { name: 'Submit' });
   screen.getByLabelText('Email');
   screen.getByPlaceholderText('Enter email');
   screen.getByText('Welcome');
   
   // ❌ Avoid test IDs when possible
   screen.getByTestId('submit-button');
   ```

### DON'T ❌

1. **Don't test third-party libraries**
2. **Don't test implementation details**
3. **Don't write tests that always pass**
4. **Don't ignore flaky tests - fix them**
5. **Don't mock everything - some integration is good**

---

## Troubleshooting

### Common Issues

#### "Cannot find module" errors
```bash
# Ensure path aliases are configured in vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

#### Tests timing out
```typescript
// Increase timeout for slow async operations
it('should complete long operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

#### React Testing Library queries not finding elements
```typescript
// Use findBy* for async elements
const element = await screen.findByText('Loaded');

// Use debug to see current DOM
screen.debug();

// Check if element is in a portal/modal
const modal = within(screen.getByRole('dialog'));
modal.getByText('Modal content');
```

#### Mock not being applied
```typescript
// Ensure mock is defined before imports
vi.mock('./module'); // Must be at top level

// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

---

## Quick Reference

### Vitest Matchers

```typescript
// Equality
expect(value).toBe(expected);           // Strict equality
expect(value).toEqual(expected);        // Deep equality
expect(value).toMatchObject(partial);   // Partial object match

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(n);
expect(value).toBeLessThan(n);
expect(value).toBeCloseTo(n, decimals);

// Strings
expect(string).toMatch(/regex/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(n);

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('message');
expect(() => fn()).toThrow(ErrorClass);

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// Mocks
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(n);
```

### Testing Library Queries

| Query Type | 0 Matches | 1 Match | >1 Matches | Async |
|------------|-----------|---------|------------|-------|
| `getBy*` | throw | return | throw | No |
| `queryBy*` | null | return | throw | No |
| `findBy*` | throw | return | throw | Yes |
| `getAllBy*` | throw | array | array | No |
| `queryAllBy*` | [] | array | array | No |
| `findAllBy*` | throw | array | array | Yes |

---

---

## End-to-End Testing with Playwright

### Overview

E2E tests simulate real user interactions across the full application stack. They run in real browsers and test complete user flows.

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI mode
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Run with debugging
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/tests/auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests matching pattern
npx playwright test -g "login"
```

### E2E Test Structure

```
e2e/
├── fixtures/
│   ├── auth.fixture.ts       # Authentication fixture
│   └── test-data.ts          # Test data constants
├── pages/
│   ├── landing.page.ts       # Landing Page Object
│   └── auth.page.ts          # Auth Modal Page Object
└── tests/
    ├── landing.spec.ts       # Landing page tests
    ├── auth.spec.ts          # Authentication tests
    ├── navigation.spec.ts    # Navigation tests
    ├── responsive.spec.ts    # Responsive design tests
    └── accessibility.spec.ts # Accessibility tests
```

### Writing New E2E Tests

#### 1. Create a Page Object

Page Objects encapsulate page-specific selectors and actions:

```typescript
// e2e/pages/my.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class MyPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.submitButton = page.getByRole('button', { name: 'Submit' });
  }

  async goto() {
    await this.page.goto('/my-page');
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectHeadingVisible() {
    await expect(this.heading).toBeVisible();
  }
}
```

#### 2. Write Test Specification

```typescript
// e2e/tests/my.spec.ts
import { test, expect } from '@playwright/test';
import { MyPage } from '../pages/my.page';

test.describe('My Feature', () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    myPage = new MyPage(page);
    await myPage.goto();
  });

  test('should display heading', async () => {
    await myPage.expectHeadingVisible();
  });

  test('should submit form', async ({ page }) => {
    await myPage.submit();
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Playwright Best Practices

#### Selector Priority (most to least preferred)

```typescript
// ✅ Role-based (most reliable, accessible)
page.getByRole('button', { name: 'Submit' });
page.getByRole('heading', { level: 1 });

// ✅ Label/text-based
page.getByLabel('Email');
page.getByPlaceholder('Enter email');
page.getByText('Welcome');

// ⚠️ Test ID (when semantic selectors don't work)
page.getByTestId('submit-button');

// ❌ CSS selectors (fragile, avoid)
page.locator('.btn-primary');
page.locator('#submit');
```

#### Waiting Strategies

```typescript
// Auto-waiting (preferred)
await page.getByRole('button').click(); // Waits automatically

// Explicit wait for element
await expect(page.getByText('Loaded')).toBeVisible();

// Wait for navigation
await page.waitForURL('/dashboard');

// Wait for network idle
await page.waitForLoadState('networkidle');
```

#### Handling Modals and Dialogs

```typescript
// Wait for modal to appear
const modal = page.locator('[role="dialog"]');
await expect(modal).toBeVisible();

// Interact within modal
await modal.getByRole('button', { name: 'Confirm' }).click();

// Close with Escape
await page.keyboard.press('Escape');
```

### Browser Configuration

Tests run on multiple browsers/devices:

| Project | Device |
|---------|--------|
| chromium | Desktop Chrome |
| firefox | Desktop Firefox |
| webkit | Desktop Safari |
| mobile-chrome | Pixel 5 |
| mobile-safari | iPhone 12 |

Run specific browser:
```bash
npx playwright test --project=chromium
npx playwright test --project=mobile-safari
```

### Debugging E2E Tests

```bash
# Interactive UI mode
npm run test:e2e:ui

# Step-by-step debugging
npm run test:e2e:debug

# Generate trace on failure (auto-configured)
# View trace: npx playwright show-trace trace.zip
```

### Common Patterns

#### Testing Responsive Design

```typescript
test.describe('Mobile', () => {
  test.use({ ...devices['iPhone 12'] });
  
  test('should show mobile menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
  });
});
```

#### Testing Form Validation

```typescript
test('should show validation errors', async ({ page }) => {
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Email is required')).toBeVisible();
});
```

#### Screenshots and Videos

Failed tests automatically capture screenshots and videos. Find them in:
- `playwright-report/` - HTML report
- `test-results/` - Screenshots and videos

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
