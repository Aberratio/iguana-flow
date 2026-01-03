# Cursor Rules - Strict Development Guidelines

## Overview

This directory contains comprehensive, strict development rules for the IguanaFlow project. These rules enforce:

- **100% test coverage** requirement before any code changes
- **Strict separation of concerns** (logic, data, presentation layers)
- **Maximum security** and database safety
- **UI component consistency** and responsiveness
- **Minimal external library** usage
- **Zero tolerance for regressions**

## Rule Files

### 1. [General Development Rules](./01-general-development.md)
Core development principles including:
- Testing-first approach (TDD)
- Zero tolerance for regressions
- Confidence requirement (100% certainty)
- Code review standards
- Documentation requirements
- External dependency minimization

### 2. [React Architecture Rules](./02-react-architecture.md)
Component architecture and separation of concerns:
- Logic layer (custom hooks)
- Data layer (TanStack Query + Supabase)
- Presentation layer (pure React components)
- Container vs presentational components
- File organization patterns

### 3. [UI Components Rules](./03-ui-components.md)
UI component standards:
- Base components (shadcn/ui)
- Responsive design (mobile-first)
- Design consistency
- Accessibility requirements
- External library minimization
- Component composition

### 4. [Security Rules](./04-security.md)
Maximum security requirements:
- Authentication verification
- Authorization checks (roles/permissions)
- Input validation (Zod schemas)
- Row Level Security (RLS)
- Secrets management
- XSS protection
- Error handling security

### 5. [Database Operations Rules](./05-database-operations.md)
Data safety and transaction rules:
- Soft deletes (never hard delete)
- Transactions for multi-step operations
- Error handling
- Query patterns
- Data validation
- Backup requirements
- Query optimization

### 6. [Testing Requirements](./06-testing.md)
Comprehensive testing standards:
- Unit tests (100% for utilities/hooks)
- Component tests (80%+ coverage)
- E2E tests (critical user flows)
- Test structure and organization
- Mocking patterns
- Test quality standards

### 7. [TypeScript Quality Rules](./07-typescript-quality.md)
Strict type safety requirements:
- No `any` types
- Supabase generated types
- Interface definitions
- Null safety
- Type exports
- Generic types
- Type narrowing

### 8. [State Management Rules](./08-state-management.md)
State management patterns:
- Server state (TanStack Query)
- Client state (React hooks)
- Global state (React Context)
- Cache invalidation
- Optimistic updates
- Performance optimization

## Key Principles

### 1. Safety First
- Database operations must be reversible or confirmed
- Never lose data
- Always backup before destructive operations
- Use soft deletes

### 2. Test Everything
- No code without tests
- Write tests first (TDD)
- Maintain high coverage (80%+)
- Test edge cases and error paths

### 3. Consistency
- Follow existing patterns in codebase
- Use established conventions
- Maintain design consistency
- Reuse existing components and utilities

### 4. Security
- Maximum security at all layers
- Verify authentication and authorization
- Validate all inputs
- Never expose sensitive information

### 5. Type Safety
- Leverage TypeScript fully
- No `any` types
- Use generated types from Supabase
- Handle null/undefined explicitly

### 6. User Experience
- Responsive design (mobile-first)
- Accessible components
- Performance optimized
- Error handling with user-friendly messages

## Quick Reference

### Before Writing Code
1. ✅ Write tests first (TDD)
2. ✅ Understand existing patterns
3. ✅ Check if component/hook already exists
4. ✅ Verify security requirements
5. ✅ Plan state management approach

### Before Committing
1. ✅ All tests pass (`npm test`)
2. ✅ Coverage meets requirements (`npm run test:coverage`)
3. ✅ Linting passes (`npm run lint`)
4. ✅ Type checking passes
5. ✅ No console errors/warnings
6. ✅ E2E tests pass (if critical flows changed)

### Component Checklist
- [ ] Uses base components from `src/components/ui/`
- [ ] Responsive on mobile, tablet, desktop
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Has TypeScript interface for props
- [ ] Handles loading and error states
- [ ] Uses consistent design tokens
- [ ] Has tests written
- [ ] No unnecessary external dependencies
- [ ] Follows separation of concerns

### Database Operation Checklist
- [ ] Soft delete implemented (if deletion needed)
- [ ] Error handling in place
- [ ] Data validated before operation
- [ ] RLS policies verified
- [ ] Query optimized
- [ ] Soft-deleted records filtered out
- [ ] Transaction used for multi-step operations
- [ ] Backup created for destructive operations

### Security Checklist
- [ ] Authentication verified
- [ ] Authorization checked (roles/permissions)
- [ ] Input validation with Zod
- [ ] User content sanitized
- [ ] RLS policies tested
- [ ] No secrets in code
- [ ] Error messages don't expose sensitive info

## File Structure

```
.cursor/
└── rules/
    ├── README.md (this file)
    ├── 01-general-development.md
    ├── 02-react-architecture.md
    ├── 03-ui-components.md
    ├── 04-security.md
    ├── 05-database-operations.md
    ├── 06-testing.md
    ├── 07-typescript-quality.md
    └── 08-state-management.md
```

## References

### Project Documentation
- Technical docs: `docs/TECHNICAL.md`
- Testing guide: `docs/TESTING.md`
- Security policy: `SECURITY.md`
- Contributing: `CONTRIBUTING.md`

### Code Examples
- Component tests: `src/components/__tests__/Button.test.tsx`
- Hook tests: `src/hooks/__tests__/`
- Utility tests: `src/lib/__tests__/utils.test.ts`
- E2E tests: `e2e/tests/`

### Key Files
- Base components: `src/components/ui/`
- Custom hooks: `src/hooks/`
- Supabase types: `src/integrations/supabase/types.ts`
- Auth context: `src/contexts/AuthContext.tsx`
- RLS policies: `supabase/migrations/`

## Enforcement

These rules are **non-negotiable**. If you cannot follow them:

1. **Ask for clarification** - Don't guess or assume
2. **Request additional time** - Proper implementation takes time
3. **Do not compromise** - Testing and security are not optional

## Questions?

If you have questions about these rules or need clarification:

1. Review the specific rule file
2. Check existing codebase patterns
3. Review project documentation
4. Ask for help rather than guessing

---

**Remember**: These rules exist to ensure code quality, security, and maintainability. Following them strictly will result in a robust, testable, and secure codebase.

