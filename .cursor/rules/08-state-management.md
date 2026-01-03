# State Management Rules

## Core Principle: Right Tool for Right State

Use the appropriate state management solution for each type of state.

## 1. State Categories

### Server State (Custom Hooks with useState/useEffect)
**MANDATORY**: Use custom hooks with useState/useEffect for ALL server data.

**What is Server State:**
- Data from Supabase database
- Data from API calls
- Data fetched from external sources
- Data that needs to be refreshed

**Example Pattern:**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ✅ Fetching server data with custom hook
export const useFeedPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Map and transform data if needed
      const mapped = (data || []).map(post => ({
        ...post,
        // custom transformations
      }));

      setPosts(mapped);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    isLoading,
    error,
    refetch: fetchPosts,
  };
};

// ✅ Mutating server data
export const useCreatePost = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPost = useCallback(async (postData: PostData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: createError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (createError) throw createError;
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error creating post:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    createPost,
    isSubmitting,
    error,
  };
};
```

**Rules:**
- Use `useState` + `useEffect` + `useCallback` for server data
- Always handle loading and error states
- Use `useCallback` to memoize fetch functions
- Provide `refetch` function for manual refresh
- Map and transform data in the hook for clean component usage
- Handle errors gracefully with user-friendly messages

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
- Server data (use custom hooks with useState/useEffect)
- Component-specific state (use useState)
- Frequently changing state (causes re-renders)
- Derived state (compute in component)

## 2. Custom Hook Patterns for Server Data

### Standard Fetch Pattern
**REQUIRED**: Follow consistent pattern for all data fetching hooks.

```typescript
export const useCustomData = (filters?: Filters) => {
  const [data, setData] = useState<DataType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('table')
        .select('*');

      // Apply filters if provided
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Map and transform data
      const mapped = (result || []).map(item => ({
        id: item.id,
        name: item.name,
        // custom transformations
      }));

      setData(mapped);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.category]); // Dependencies for refetch

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};
```

### Mutation Pattern
**REQUIRED**: Handle mutations with proper error handling.

```typescript
export const useCreateItem = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createItem = useCallback(async (itemData: ItemData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: createError } = await supabase
        .from('items')
        .insert(itemData)
        .select()
        .single();

      if (createError) throw createError;
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error creating item:', error);
      throw error; // Re-throw for component handling
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    createItem,
    isSubmitting,
    error,
  };
};
```

### Refetch After Mutation
**REQUIRED**: Manually refetch data after mutations when needed.

```typescript
export const MyComponent = () => {
  const { data, refetch } = useCustomData();
  const { createItem } = useCreateItem();

  const handleCreate = async (itemData: ItemData) => {
    try {
      await createItem(itemData);
      // Refetch data after successful creation
      await refetch();
      toast.success('Item created successfully');
    } catch (error) {
      toast.error('Failed to create item');
    }
  };

  return (
    // Component JSX
  );
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
- [ ] Using correct tool (custom hooks with useState/useEffect, useState, Context)
- [ ] State is colocated appropriately
- [ ] Derived state is computed, not stored
- [ ] Refetch implemented after mutations when needed
- [ ] Loading and error states handled
- [ ] Performance optimizations applied where needed (useCallback, useMemo)
- [ ] No unnecessary re-renders

## References

- Auth Context: `src/contexts/AuthContext.tsx`
- Hook examples: `src/hooks/useUserRole.ts`, `src/hooks/useAuthState.ts`, `src/hooks/useFeedPosts.ts`

