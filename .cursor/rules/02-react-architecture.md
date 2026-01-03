# React Architecture Rules

## Core Principle: Separation of Concerns

Components MUST be separated into three distinct layers:
1. **Logic Layer**: Custom hooks (`src/hooks/`)
2. **Data Layer**: TanStack Query + Supabase client
3. **Presentation Layer**: Pure React components

## Layer Responsibilities

### 1. Logic Layer (Custom Hooks)
**Location**: `src/hooks/`

**Responsibilities:**
- Business logic
- State management logic
- Side effects (useEffect)
- Data transformations
- Complex calculations
- Form validation logic

**Rules:**
- NO JSX in hooks
- NO direct database calls (use data layer functions)
- Export arrow functions (no default exports)
- Return objects with clear property names
- Handle loading and error states

**Example Pattern:**
```typescript
// src/hooks/useUserRole.ts
export const useUserRole = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Logic here, no JSX
  }, [user]);

  return {
    userRole,
    isLoading,
    isTrainer: userRole === 'trainer',
    isAdmin: userRole === 'admin',
  };
};
```

**DO:**
```typescript
export const useCustomHook = () => {
  // Logic only
  const [state, setState] = useState();
  // ... logic
  return { state, actions };
};
```

**DON'T:**
```typescript
// ❌ NO JSX in hooks
export const useBadHook = () => {
  return <div>Bad</div>; // NEVER DO THIS
};

// ❌ NO direct database calls
export const useBadHook = () => {
  const data = await supabase.from('table').select(); // Use data layer instead
};
```

### 2. Data Layer (TanStack Query + Supabase)
**Location**: Custom hooks that use TanStack Query

**Responsibilities:**
- Fetching data from Supabase
- Caching server state
- Mutations (create, update, delete)
- Query invalidation
- Optimistic updates

**Rules:**
- Use TanStack Query for ALL server data
- Never use useState for server data
- Always handle loading and error states
- Use proper query keys for cache management
- Invalidate queries after mutations

**Example Pattern:**
```typescript
// src/hooks/useFeedPosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFeedPosts = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['feedPosts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return { posts: data, isLoading, error };
};
```

**Mutation Pattern:**
```typescript
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: PostData) => {
      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
    },
  });
};
```

### 3. Presentation Layer (React Components)
**Location**: `src/components/`, `src/pages/`

**Responsibilities:**
- Rendering UI
- User interactions (clicks, form inputs)
- Displaying data
- Composing smaller components

**Rules:**
- NO business logic in components
- NO direct database calls
- Use hooks for logic and data
- Keep components small and focused
- Extract reusable UI components

**Component Structure:**
```typescript
// src/components/MyComponent.tsx
import { useCustomHook } from '@/hooks/useCustomHook';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  // Props interface
}

export const MyComponent = ({ ...props }: MyComponentProps) => {
  // 1. Use hooks for logic and data
  const { data, isLoading, actions } = useCustomHook();

  // 2. Early returns for loading/error
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  // 3. Render UI
  return (
    <div>
      {/* JSX only */}
    </div>
  );
};
```

## Component Patterns

### Container vs Presentational Components

**Container Components** (Pages, Feature Components):
- Use hooks for data and logic
- Manage component-level state
- Compose presentational components
- Handle routing and navigation

**Presentational Components** (UI Components):
- Receive data via props
- No business logic
- Reusable across the app
- Located in `src/components/ui/`

**Example:**
```typescript
// Container Component (uses hooks)
export const UserProfilePage = () => {
  const { user, isLoading } = useUserProfile();
  const { updateProfile } = useUpdateProfile();

  if (isLoading) return <LoadingSpinner />;

  return (
    <UserProfileCard
      user={user}
      onUpdate={updateProfile}
    />
  );
};

// Presentational Component (pure UI)
interface UserProfileCardProps {
  user: User;
  onUpdate: (data: UpdateData) => void;
}

export const UserProfileCard = ({ user, onUpdate }: UserProfileCardProps) => {
  return (
    <Card>
      <CardContent>
        <Avatar src={user.avatar_url} />
        <h2>{user.username}</h2>
        {/* Pure presentation */}
      </CardContent>
    </Card>
  );
};
```

## File Organization

### Component Files
```
src/components/
├── ui/              # Base UI components (shadcn/ui)
├── FeatureName/     # Feature-specific components
│   ├── FeatureComponent.tsx
│   └── FeatureSubComponent.tsx
└── __tests__/       # Component tests
```

### Hook Files
```
src/hooks/
├── useFeatureName.ts
└── __tests__/
    └── useFeatureName.test.ts
```

### Page Files
```
src/pages/
└── PageName.tsx     # Container components that use hooks
```

## Component Rules

### 1. No Direct Database Calls in Components
**FORBIDDEN:**
```typescript
// ❌ NEVER DO THIS
export const BadComponent = () => {
  const [data, setData] = useState();
  
  useEffect(() => {
    supabase.from('table').select().then(setData); // NO!
  }, []);
};
```

**REQUIRED:**
```typescript
// ✅ DO THIS
export const GoodComponent = () => {
  const { data } = useTableData(); // Hook handles data fetching
};
```

### 2. Extract Logic to Hooks
If a component has:
- Complex state logic
- Multiple useEffect hooks
- Data transformations
- Business rules

→ Extract to a custom hook

**Example:**
```typescript
// Before: Logic in component
export const ComplexComponent = () => {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  
  useEffect(() => {
    // Complex logic
  }, [state1]);
  
  useEffect(() => {
    // More complex logic
  }, [state2]);
  
  // Component is too complex
};

// After: Logic extracted to hook
export const useComplexLogic = () => {
  // All logic here
  return { state1, state2, actions };
};

export const ComplexComponent = () => {
  const { state1, state2, actions } = useComplexLogic();
  // Clean component
};
```

### 3. Use Arrow Functions (No Default Exports)
**REQUIRED:**
```typescript
// ✅ Arrow function export
export const MyComponent = () => {
  return <div>Content</div>;
};
```

**FORBIDDEN:**
```typescript
// ❌ Default export
export default function MyComponent() {
  return <div>Content</div>;
}
```

### 4. TypeScript Interfaces for Props
Always define interfaces for component props:

```typescript
interface ComponentProps {
  id: string;
  title: string;
  onAction?: () => void;
  optional?: boolean;
}

export const Component = ({ id, title, onAction, optional }: ComponentProps) => {
  // Component implementation
};
```

### 5. Component Composition
Prefer composition over large monolithic components:

```typescript
// ✅ Composed components
export const FeaturePage = () => {
  return (
    <Layout>
      <FeatureHeader />
      <FeatureContent />
      <FeatureFooter />
    </Layout>
  );
};

// ❌ Monolithic component
export const FeaturePage = () => {
  return (
    <div>
      {/* 500 lines of JSX */}
    </div>
  );
};
```

## State Management Rules

### Local Component State
Use `useState` for:
- Form inputs
- UI state (modals, dropdowns, toggles)
- Temporary calculations
- Component-specific state

### Server State
Use TanStack Query for:
- Data from Supabase
- Cached API responses
- Mutations
- Background refetching

### Global State
Use React Context sparingly for:
- Authentication (AuthContext)
- Internationalization (DictionaryContext)
- Theme (if needed)

**DO NOT** use Context for:
- Server data (use TanStack Query)
- Component-specific state (use useState)
- Frequently changing state (causes re-renders)

## Error Boundaries

Always handle errors gracefully:

```typescript
export const Component = () => {
  const { data, error, isLoading } = useData();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return <DataDisplay data={data} />;
};
```

## References

- Hook examples: `src/hooks/useUserRole.ts`, `src/hooks/useAuthState.ts`
- Component examples: `src/components/ui/button.tsx`
- Testing: `src/components/__tests__/Button.test.tsx`

