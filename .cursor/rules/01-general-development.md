# General Development Rules

## Core Principles

### 1. Testing First (TDD Approach)

**CRITICAL**: All code changes MUST have tests written BEFORE implementation.

- Write tests first, then implement the feature
- Tests must pass before any code is considered complete
- If you cannot write a test for something, you cannot implement it
- All new features require:
  - Unit tests for utilities and hooks
  - Component tests for React components
  - E2E tests for critical user flows

**Example Pattern:**

```typescript
// 1. Write test first
describe("newFeature", () => {
  it("should do something", () => {
    // test implementation
  });
});

// 2. Then implement feature
export const newFeature = () => {
  // implementation
};
```

### 2. Zero Tolerance for Regressions

**MANDATORY**: Run full test suite before any commit.

- Run `npm test` before committing
- Run `npm run test:coverage` before PR/merge
- All existing tests MUST pass
- If a test fails, fix it immediately - do not skip or disable tests
- If you break existing functionality, you MUST fix it before proceeding

**Pre-commit Checklist:**

- [ ] All unit tests pass: `npm test`
- [ ] All component tests pass
- [ ] All E2E tests pass: `npm run test:e2e`
- [ ] Type checking passes: `npm run type-check` (if available)
- [ ] Linting passes: `npm run lint`
- [ ] No console errors or warnings in browser console

### 3. Confidence Requirement

**STRICT**: Only implement features when 100% certain they work.

- If you are not 100% certain something works, DO NOT implement it
- Ask for clarification or research first
- Test thoroughly in isolation before integrating
- Verify edge cases and error handling
- Test with real data patterns (not just happy paths)

**Red Flags - DO NOT PROCEED if:**

- You're guessing about behavior
- You haven't tested the specific use case
- You're copying code without understanding it
- You're unsure about security implications
- You're uncertain about database impact

### 4. Code Review Standards

All changes must pass:

1. **Linting**: `npm run lint` must pass with zero errors
2. **Type Checking**: TypeScript compilation must succeed
3. **Tests**: All tests must pass (unit, component, E2E)
4. **Code Quality**: Follow existing patterns and conventions
5. **Security Review**: No security vulnerabilities introduced

### 5. Documentation Requirements

Update documentation when changing behavior:

- Update `docs/TECHNICAL.md` for architectural changes
- Update `docs/TESTING.md` for testing pattern changes
- Update component JSDoc comments for API changes
- Update README if user-facing behavior changes
- Document breaking changes clearly

### 6. External Dependencies

**MINIMIZE**: Prefer custom solutions over new dependencies.

- Before adding a new package, check if existing code can solve it
- If adding a dependency is necessary:
  - Verify it's actively maintained
  - Check bundle size impact
  - Ensure it doesn't conflict with existing dependencies
  - Document why it's needed
  - Consider security implications

**Approved External Libraries:**

- React ecosystem (React, React DOM, React Router)
- Supabase client
- TanStack Query
- shadcn/ui (Radix UI primitives)
- Tailwind CSS
- Testing libraries (Vitest, React Testing Library, Playwright)
- Zod (validation)
- date-fns (date utilities)

**Requires Justification:**

- Any library not in the approved list
- Libraries that duplicate existing functionality
- Large dependencies (>50KB minified)

### 7. Code Consistency

Follow existing patterns strictly:

- Match naming conventions (camelCase for functions, PascalCase for components)
- Follow file organization patterns
- Use existing utility functions from `src/lib/utils.ts`
- Use existing hooks from `src/hooks/`
- Use existing UI components from `src/components/ui/`

### 8. Error Handling

All code must handle errors gracefully:

- Never let errors crash the application
- Always provide user-friendly error messages
- Log errors appropriately (use console.error, not console.log)
- Handle network failures
- Handle missing data
- Handle edge cases

**Example:**

```typescript
try {
  const result = await operation();
  return result;
} catch (error) {
  console.error("Operation failed:", error);
  toast.error("Something went wrong. Please try again.");
  return null; // or appropriate fallback
}
```

### 9. Performance Considerations

- Avoid unnecessary re-renders
- Use React.memo for expensive components
- Lazy load heavy components
- Optimize images and assets
- Consider bundle size impact

### 10. Git Workflow

- Write clear, descriptive commit messages
- One logical change per commit
- Do not commit:
  - Console.log statements (except console.error/warn)
  - Debug code
  - Temporary files
  - Secrets or API keys
  - node_modules
  - Build artifacts

## Enforcement

These rules are non-negotiable. If you cannot follow them:

1. Ask for clarification
2. Request additional time to implement properly
3. Do not compromise on testing or security

## References

- Test examples: `src/components/__tests__/Button.test.tsx`, `src/lib/__tests__/utils.test.ts`
- Testing guide: `docs/TESTING.md`
- Technical docs: `docs/TECHNICAL.md`
