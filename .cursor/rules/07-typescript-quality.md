# TypeScript Quality Rules

## Core Principle: Maximum Type Safety

**MANDATORY**: Leverage TypeScript's type system fully. No compromises on type safety.

## 1. No `any` Types

### Strict Type Enforcement
**FORBIDDEN**: Never use `any` type. Use proper types or `unknown` with type guards.

```typescript
// ❌ FORBIDDEN
const processData = (data: any) => {
  return data.value;
};

// ✅ REQUIRED - Use proper type
interface Data {
  value: string;
}

const processData = (data: Data) => {
  return data.value;
};

// ✅ If type is truly unknown, use unknown with type guard
const processData = (data: unknown) => {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
};
```

### Type Guards for Unknown Data
```typescript
// ✅ Type guard pattern
const isUser = (data: unknown): data is User => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  );
};

const processUser = (data: unknown) => {
  if (isUser(data)) {
    // TypeScript knows data is User here
    return data.email;
  }
  throw new Error('Invalid user data');
};
```

## 2. Use Supabase Generated Types

### Leverage Database Types
**REQUIRED**: Use types from `src/integrations/supabase/types.ts`.

```typescript
// ✅ Use generated types
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Use in code
const fetchProfile = async (id: string): Promise<Profile | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return data;
};
```

**Type Extraction Pattern:**
```typescript
// Extract table types
type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

type Inserts<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

type Updates<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

// Usage
type Challenge = Tables<'challenges'>;
type ChallengeInsert = Inserts<'challenges'>;
type ChallengeUpdate = Updates<'challenges'>;
```

## 3. Interface Definitions

### Clear Component Props Interfaces
**REQUIRED**: Always define interfaces for component props.

```typescript
// ✅ Proper interface definition
interface ButtonProps {
  // Required props
  children: React.ReactNode;
  onClick: () => void;
  
  // Optional props
  variant?: 'default' | 'primary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  
  // Event handlers
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  
  // HTML attributes
  className?: string;
  'aria-label'?: string;
}

export const Button = ({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  ...props
}: ButtonProps) => {
  // Implementation
};
```

### Data Structure Interfaces
```typescript
// ✅ Define clear interfaces for data structures
interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  role: 'free' | 'premium' | 'trainer' | 'admin';
  created_at: string;
  updated_at: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  deleted_at: string | null;
}
```

## 4. Null Safety

### Explicit Null Handling
**REQUIRED**: Handle null and undefined cases explicitly.

```typescript
// ✅ Explicit null handling
const getUserName = (user: User | null): string => {
  if (!user) {
    return 'Guest';
  }
  return user.username;
};

// ✅ Optional chaining
const getAvatarUrl = (user: User | null): string | null => {
  return user?.avatar_url ?? null;
};

// ✅ Nullish coalescing
const displayName = user?.username ?? 'Anonymous';
```

### Non-Null Assertions (Avoid)
**AVOID**: Use non-null assertions (`!`) sparingly and only when absolutely certain.

```typescript
// ⚠️ Only use when 100% certain value exists
const element = document.getElementById('myId')!; // Only if element always exists

// ✅ Better - handle null case
const element = document.getElementById('myId');
if (!element) {
  throw new Error('Element not found');
}
// Now TypeScript knows element is not null
```

## 5. Type Exports

### Export Types Alongside Components
**REQUIRED**: Export types when they might be used elsewhere.

```typescript
// ✅ Export types
export interface ButtonProps {
  // ...
}

export const Button = (props: ButtonProps) => {
  // ...
};

// Usage in other files
import { Button, type ButtonProps } from '@/components/ui/button';
```

### Type-Only Imports
```typescript
// ✅ Use type-only imports for types
import type { User } from '@/types/auth';
import type { Database } from '@/integrations/supabase/types';

// Regular imports for values
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
```

## 6. Generic Types

### Use Generics for Reusable Code
```typescript
// ✅ Generic utility function
const fetchById = async <T extends { id: string }>(
  table: string,
  id: string
): Promise<T | null> => {
  const { data } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return data as T | null;
};

// Usage
const user = await fetchById<User>('profiles', userId);
const challenge = await fetchById<Challenge>('challenges', challengeId);
```

## 7. Strict TypeScript Configuration

### TypeScript Config Requirements
**REQUIRED**: Maintain strict TypeScript settings.

**Required Settings:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Current Config:**
- `noImplicitAny`: true ✅
- `noUnusedParameters`: true ✅
- `noUnusedLocals`: true ✅
- `strictNullChecks`: false ⚠️ (should be true, but currently false)

**Note**: `strictNullChecks` is currently false in `tsconfig.json`. When possible, enable it for better null safety.

## 8. Type Assertions

### Use Type Assertions Sparingly
**AVOID**: Type assertions should be used only when necessary.

```typescript
// ⚠️ Only when absolutely necessary
const data = response as UserData;

// ✅ Better - validate first
const isUserData = (data: unknown): data is UserData => {
  // Validation logic
};

if (isUserData(response)) {
  // TypeScript knows response is UserData
  const data = response;
}
```

## 9. Function Return Types

### Explicit Return Types
**REQUIRED**: Always specify return types for functions.

```typescript
// ✅ Explicit return type
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ✅ Async functions
const fetchUser = async (id: string): Promise<User | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return data;
};

// ✅ React components
export const MyComponent = (): JSX.Element => {
  return <div>Content</div>;
};
```

## 10. Enum vs Union Types

### Prefer Union Types
**RECOMMENDED**: Use union types over enums for better type inference.

```typescript
// ✅ Union type (preferred)
type UserRole = 'free' | 'premium' | 'trainer' | 'admin';

interface User {
  role: UserRole;
}

// ⚠️ Enum (use only if needed for runtime values)
enum UserRole {
  Free = 'free',
  Premium = 'premium',
  Trainer = 'trainer',
  Admin = 'admin',
}
```

## 11. Type Narrowing

### Use Type Narrowing
```typescript
// ✅ Type narrowing
const processValue = (value: string | number) => {
  if (typeof value === 'string') {
    // TypeScript knows value is string here
    return value.toUpperCase();
  }
  // TypeScript knows value is number here
  return value.toFixed(2);
};

// ✅ Discriminated unions
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const handleResult = <T>(result: Result<T>) => {
  if (result.success) {
    // TypeScript knows result.data exists
    return result.data;
  }
  // TypeScript knows result.error exists
  throw new Error(result.error);
};
```

## 12. Utility Types

### Leverage TypeScript Utility Types
```typescript
// ✅ Use utility types
type PartialUser = Partial<User>; // All properties optional
type RequiredUser = Required<User>; // All properties required
type UserEmail = Pick<User, 'email'>; // Pick specific properties
type UserWithoutId = Omit<User, 'id'>; // Omit specific properties

// ✅ Custom utility types
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
```

## 13. Type Safety Checklist

Before considering code complete:

- [ ] No `any` types used
- [ ] All function return types specified
- [ ] All component props have interfaces
- [ ] Null/undefined cases handled explicitly
- [ ] Supabase types used where applicable
- [ ] Types exported when needed
- [ ] Type guards used for unknown data
- [ ] No unnecessary type assertions
- [ ] TypeScript compilation succeeds with no errors
- [ ] No unused type parameters

## References

- TypeScript config: `tsconfig.json`, `tsconfig.app.json`
- Supabase types: `src/integrations/supabase/types.ts`
- Type definitions: `src/types/`

