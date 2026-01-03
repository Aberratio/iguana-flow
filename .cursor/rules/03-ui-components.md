# UI Components Rules

## Core Principles

### 1. Base Components First
**MANDATORY**: Always use shadcn/ui components from `src/components/ui/` as the foundation.

- Never create custom button/input/card components when base components exist
- Extend base components, don't replace them
- Use existing variants and styles
- Maintain consistency across the application

**Available Base Components:**
- `Button` - All button interactions
- `Card`, `CardContent`, `CardHeader`, `CardFooter` - Content containers
- `Dialog`, `DialogContent`, `DialogTrigger` - Modals and dialogs
- `Input`, `Textarea`, `Label` - Form inputs
- `Badge` - Status indicators
- `Avatar`, `AvatarImage`, `AvatarFallback` - User avatars
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tab navigation
- And more in `src/components/ui/`

**Example:**
```typescript
// ✅ Use base components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const MyComponent = () => {
  return (
    <Card>
      <CardContent>
        <Button variant="default">Click me</Button>
      </CardContent>
    </Card>
  );
};
```

### 2. Responsive Design (Mobile-First)
**REQUIRED**: All components must be responsive and mobile-first.

- Design for mobile first, then enhance for larger screens
- Test on multiple breakpoints:
  - Mobile: < 640px (default)
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Use `use-mobile` hook for conditional rendering when needed

**Breakpoint Strategy:**
```typescript
// Mobile-first approach
<div className="
  flex flex-col          // Mobile: column
  md:flex-row            // Tablet+: row
  gap-2                  // Mobile: small gap
  md:gap-4               // Tablet+: larger gap
  p-4                    // Mobile: padding
  md:p-6                 // Tablet+: more padding
">
```

**Conditional Rendering:**
```typescript
import { useMobile } from '@/hooks/use-mobile';

export const ResponsiveComponent = () => {
  const isMobile = useMobile();

  return (
    <>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
    </>
  );
};
```

**Testing Responsiveness:**
- Test in browser DevTools responsive mode
- Test on actual devices when possible
- Verify touch targets are at least 44x44px on mobile
- Ensure text is readable without zooming

### 3. Design Consistency
**MANDATORY**: Use existing design tokens and patterns.

**Color System:**
- Use Tailwind color classes from the theme
- Follow existing gradient patterns (see `Button` component)
- Maintain consistent color usage across components

**Spacing:**
- Use Tailwind spacing scale: `p-2`, `p-4`, `p-6`, `gap-2`, `gap-4`, etc.
- Maintain consistent spacing between related elements
- Use `space-y-*` or `space-x-*` for uniform spacing

**Typography:**
- Use Tailwind typography classes: `text-sm`, `text-base`, `text-lg`, etc.
- Maintain consistent font weights: `font-medium`, `font-semibold`, `font-bold`
- Use consistent heading hierarchy

**Example:**
```typescript
// ✅ Consistent design
<Card className="p-4 md:p-6">
  <h2 className="text-lg font-semibold mb-4">Title</h2>
  <p className="text-sm text-muted-foreground mb-4">Description</p>
  <Button variant="default" size="default">Action</Button>
</Card>
```

### 4. Component Composition
Build complex UIs by composing simple components:

```typescript
// ✅ Composed component
export const FeatureCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <FeatureContent />
      </CardContent>
      <CardFooter>
        <FeatureActions />
      </CardFooter>
    </Card>
  );
};
```

### 5. Accessibility (a11y)
**REQUIRED**: All components must be accessible.

**ARIA Labels:**
```typescript
<Button aria-label="Close dialog">
  <X />
</Button>

<Input
  aria-label="Search exercises"
  aria-describedby="search-help"
/>
```

**Keyboard Navigation:**
- All interactive elements must be keyboard accessible
- Use semantic HTML elements (`<button>`, `<a>`, `<input>`)
- Implement proper focus management
- Support Escape key for modals/dialogs

**Screen Reader Support:**
- Use proper heading hierarchy (`h1`, `h2`, `h3`)
- Provide alt text for images
- Use `aria-live` regions for dynamic content
- Ensure form labels are properly associated

**Example:**
```typescript
export const AccessibleModal = ({ isOpen, onClose, title, children }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-labelledby="modal-title">
        <h2 id="modal-title" className="sr-only">{title}</h2>
        {children}
        <Button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4"
        >
          <X />
        </Button>
      </DialogContent>
    </Dialog>
  );
};
```

### 6. External Libraries - Minimize Usage
**STRICT**: Prefer custom solutions over new dependencies.

**Before Adding a Library:**
1. Check if existing code can solve it
2. Check if a base component can be extended
3. Consider bundle size impact
4. Verify it's actively maintained
5. Document why it's necessary

**Approved UI Libraries:**
- shadcn/ui (Radix UI primitives) - Base components
- Tailwind CSS - Styling
- Lucide React - Icons
- Framer Motion - Animations (when needed)

**Requires Justification:**
- Any UI library not listed above
- Libraries that duplicate existing functionality
- Large dependencies (>30KB minified)

**Example - Custom Solution:**
```typescript
// ✅ Custom solution instead of library
export const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

### 7. Component Props Interface
Always define clear TypeScript interfaces:

```typescript
interface ComponentProps {
  // Required props
  title: string;
  id: string;
  
  // Optional props
  description?: string;
  onAction?: () => void;
  
  // Variant props
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  
  // Children
  children?: React.ReactNode;
}

export const Component = ({
  title,
  id,
  description,
  onAction,
  variant = 'default',
  size = 'md',
  children,
}: ComponentProps) => {
  // Implementation
};
```

### 8. Loading and Error States
All components that fetch data must handle:

```typescript
export const DataComponent = () => {
  const { data, isLoading, error } = useData();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  return <DataDisplay data={data} />;
};
```

### 9. Image Optimization
**REQUIRED**: Use `LazyImage` component for all images.

```typescript
import { LazyImage } from '@/components/LazyImage';

// ✅ Use LazyImage
<LazyImage
  src={imageUrl}
  alt="Description"
  className="w-full h-auto"
/>

// ❌ Don't use regular img tag
<img src={imageUrl} alt="Description" />
```

### 10. Form Components
Use React Hook Form with Zod validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const FormComponent = () => {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input
        {...form.register('email')}
        error={form.formState.errors.email?.message}
      />
      {/* More fields */}
    </form>
  );
};
```

### 11. Modal and Dialog Patterns
Use consistent modal patterns:

```typescript
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export const FeatureModal = ({ isOpen, onClose, children }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {children}
      </DialogContent>
    </Dialog>
  );
};
```

**Modal Rules:**
- Always provide close button
- Support Escape key
- Trap focus within modal
- Prevent body scroll when open
- Use proper ARIA attributes

### 12. Button Variants
Use existing button variants consistently:

```typescript
// Available variants (from button.tsx):
// - default: Primary action
// - primary: Secondary primary action
// - destructive: Delete/destructive actions
// - outline: Secondary actions
// - secondary: Tertiary actions
// - ghost: Subtle actions
// - link: Link-style buttons

<Button variant="default">Primary Action</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Subtle</Button>
```

### 13. Component Testing
All UI components must have tests (see Testing Rules):

```typescript
// Component test example
describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should be responsive', () => {
    // Test responsive behavior
  });

  it('should be accessible', () => {
    // Test accessibility
  });
});
```

## Component Checklist

Before considering a component complete:

- [ ] Uses base components from `src/components/ui/`
- [ ] Responsive on mobile, tablet, and desktop
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Has TypeScript interface for props
- [ ] Handles loading and error states
- [ ] Uses consistent design tokens
- [ ] Has tests written
- [ ] No unnecessary external dependencies
- [ ] Follows existing patterns in codebase

## References

- Base components: `src/components/ui/`
- Button component: `src/components/ui/button.tsx`
- Mobile hook: `src/hooks/use-mobile.tsx`
- Component tests: `src/components/__tests__/Button.test.tsx`
- Tailwind config: `tailwind.config.ts`

