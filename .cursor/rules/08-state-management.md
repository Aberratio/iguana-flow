# State Management Rules

## Core Principle: Right Tool for Right State

Use the appropriate state management solution for each type of state.

## 1. State Categories

### Server State (TanStack Query)
**MANDATORY**: Use TanStack Query for ALL server data.

**What is Server State:**
- Data from Supabase database
- Data from API calls
- Data that needs to be cached
- Data that needs background refetching
- Data shared across components

**Example:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ✅ Fetching server data
export const useFeedPosts = () => {
  return useQuery({
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
};

// ✅ Mutating server data
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

**Rules:**
- NEVER use `useState` for server data
- Always use TanStack Query for Supabase queries
- Use proper query keys for cache management
- Invalidate queries after mutations
- Handle loading and error states

### Client State (React Hooks)
**MANDATORY**: Use React hooks for local component state.

**What is Client State:**
- Form inputs
- UI state (modals, dropdowns, toggles)
- Temporary calculations
- Component-specific state
- Non-persistent state

**Example:**
```typescript
// ✅ Local component state
export const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button onClick={() => setIsOpen(true)}>Open</button>
    </div>
  );
};
```

**When to Use:**
- `useState` - Simple state
- `useReducer` - Complex state with multiple actions
- `useRef` - Mutable values that don't trigger re-renders

### Global State (React Context)
**SPARINGLY**: Use Context only for truly global state.

**What is Global State:**
- Authentication state (AuthContext)
- Internationalization (DictionaryContext)
- Theme (if needed)
- Settings that affect entire app

**Example:**
```typescript
// ✅ Global state with Context
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // ... auth logic

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**DO NOT Use Context For:**
- Server data (use TanStack Query)
- Component-specific state (use useState)
- Frequently changing state (causes re-renders)
- Derived state (compute in component)

## 2. TanStack Query Patterns

### Query Keys
**REQUIRED**: Use consistent, hierarchical query keys.

```typescript
// ✅ Hierarchical query keys
const queryKeys = {
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: PostFilters) => [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },
};

// Usage
useQuery({
  queryKey: queryKeys.posts.list({ category: 'fitness' }),
  queryFn: () => fetchPosts({ category: 'fitness' }),
});
```

### Cache Invalidation
**REQUIRED**: Invalidate queries after mutations.

```typescript
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // Invalidate all post queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      // Or invalidate specific query
      queryClient.invalidateQueries({ 
        queryKey: ['posts', 'list'] 
      });
    },
  });
};
```

### Optimistic Updates
**USE CAREFULLY**: Only use when you can rollback.

```typescript
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: likePost,
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts', postId] });

      // Snapshot previous value
      const previousPost = queryClient.getQueryData(['posts', postId]);

      // Optimistically update
      queryClient.setQueryData(['posts', postId], (old: Post) => ({
        ...old,
        likes: old.likes + 1,
        isLiked: true,
      }));

      return { previousPost };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(['posts', postId], context.previousPost);
      }
    },
    onSettled: (postId) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['posts', postId] });
    },
  });
};
```

## 3. Custom Hooks for State Logic

### Extract State Logic to Hooks
**REQUIRED**: Extract complex state logic to custom hooks.

```typescript
// ✅ Complex state logic in hook
export const useFormState = (initialData: FormData) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: string, value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    // Validation logic
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await submitForm(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    data,
    errors,
    isSubmitting,
    updateField,
    submit,
  };
};
```

## 4. State Management Patterns

### Derived State
**REQUIRED**: Compute derived state, don't store it.

```typescript
// ✅ Compute derived state
export const UserProfile = ({ user }: { user: User }) => {
  // Compute, don't store
  const displayName = user.username || user.email.split('@')[0];
  const isPremium = user.role === 'premium' || user.role === 'admin';

  return (
    <div>
      <h1>{displayName}</h1>
      {isPremium && <Badge>Premium</Badge>}
    </div>
  );
};

// ❌ Don't store derived state
const [displayName, setDisplayName] = useState('');
useEffect(() => {
  setDisplayName(user.username || user.email.split('@')[0]);
}, [user]);
```

### Lifting State Up
**REQUIRED**: Lift state to the lowest common ancestor.

```typescript
// ✅ State lifted to parent
export const ParentComponent = () => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  return (
    <div>
      <ItemList
        selectedItem={selectedItem}
        onSelect={setSelectedItem}
      />
      <ItemDetails itemId={selectedItem} />
    </div>
  );
};
```

### State Colocation
**REQUIRED**: Keep state close to where it's used.

```typescript
// ✅ State colocated with component
export const Modal = () => {
  const [isOpen, setIsOpen] = useState(false);
  // State is only used in this component

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && <Dialog onClose={() => setIsOpen(false)} />}
    </>
  );
};
```

## 5. Performance Optimization

### Memoization
**USE WHEN NEEDED**: Memoize expensive computations and callbacks.

```typescript
// ✅ Memoize expensive computation
export const ExpensiveComponent = ({ items }: { items: Item[] }) => {
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return <ItemList items={sortedItems} />;
};

// ✅ Memoize callbacks
export const Component = ({ onAction }: { onAction: () => void }) => {
  const handleClick = useCallback(() => {
    onAction();
  }, [onAction]);

  return <button onClick={handleClick}>Action</button>;
};
```

### React.memo
**USE SPARINGLY**: Only memoize components that re-render frequently.

```typescript
// ✅ Memoize expensive component
export const ExpensiveComponent = React.memo(({ data }: { data: Data }) => {
  // Expensive rendering
  return <ComplexVisualization data={data} />;
});

// ❌ Don't memoize simple components
export const SimpleComponent = React.memo(({ text }: { text: string }) => {
  return <div>{text}</div>; // Unnecessary memoization
});
```

## 6. State Management Checklist

Before implementing state:

- [ ] Identified state type (server, client, global)
- [ ] Using correct tool (TanStack Query, useState, Context)
- [ ] State is colocated appropriately
- [ ] Derived state is computed, not stored
- [ ] Cache invalidation implemented for mutations
- [ ] Loading and error states handled
- [ ] Performance optimizations applied where needed
- [ ] No unnecessary re-renders

## References

- TanStack Query: `@tanstack/react-query`
- Auth Context: `src/contexts/AuthContext.tsx`
- Hook examples: `src/hooks/useUserRole.ts`, `src/hooks/useAuthState.ts`

