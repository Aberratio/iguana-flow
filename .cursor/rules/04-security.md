# Security Rules

## Core Principle: Maximum Security at All Layers

Security is non-negotiable. Every operation must be verified, validated, and protected.

## 1. Authentication Requirements

### Always Verify User Authentication
**MANDATORY**: Check authentication before any user-specific operation.

```typescript
// ✅ Always check authentication
export const useProtectedOperation = () => {
  const { user } = useAuth();

  const performOperation = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Proceed with operation
  };
};
```

**Pattern:**
- Use `useAuth()` hook to get current user
- Check `user` exists before operations
- Redirect to login if not authenticated (for protected routes)

**Example:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

export const MyComponent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Redirect to="/login" />;

  // User is authenticated, proceed
};
```

### Protected Routes
Use `ProtectedRoute` component for routes requiring authentication:

```typescript
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  }
/>
```

## 2. Authorization Requirements

### Always Check User Roles and Permissions
**MANDATORY**: Verify user has permission before operations.

**Use `useUserRole` Hook:**
```typescript
import { useUserRole } from '@/hooks/useUserRole';

export const AdminComponent = () => {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) return <LoadingSpinner />;
  if (!isAdmin) {
    return <AccessDenied />;
  }

  // User is admin, proceed
};
```

**Role-Based Access Control:**
```typescript
const { isAdmin, isTrainer, canCreateChallenges, canAccessLibrary } = useUserRole();

// Check specific permissions
if (!canCreateChallenges) {
  toast.error('You do not have permission to create challenges');
  return;
}
```

**Database-Level Authorization:**
- RLS (Row Level Security) policies are enforced at database level
- Never bypass RLS policies
- Always use authenticated user context (Supabase handles this automatically)

### Permission Checks Before Operations
```typescript
export const useCreateChallenge = () => {
  const { user } = useAuth();
  const { canCreateChallenges } = useUserRole();

  const createChallenge = async (data: ChallengeData) => {
    // 1. Check authentication
    if (!user) {
      throw new Error('Must be authenticated');
    }

    // 2. Check authorization
    if (!canCreateChallenges) {
      throw new Error('Insufficient permissions');
    }

    // 3. Proceed with operation
    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return challenge;
  };

  return { createChallenge };
};
```

## 3. Input Validation

### Zod Schemas for All User Inputs
**MANDATORY**: Validate all user inputs with Zod schemas.

```typescript
import { z } from 'zod';

// Define schema
const createPostSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(500, 'Content must be less than 500 characters'),
  image_url: z.string().url().optional(),
});

// Use in form
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export const CreatePostForm = () => {
  const form = useForm({
    resolver: zodResolver(createPostSchema),
  });

  // Form is validated before submission
};
```

**Validation Rules:**
- Validate on client side (Zod)
- Validate on server side (Supabase Edge Functions)
- Sanitize user-generated content
- Reject invalid inputs immediately

**Common Validations:**
```typescript
// Email validation
z.string().email('Invalid email address')

// URL validation
z.string().url('Invalid URL')

// String length
z.string().min(1).max(500)

// Number ranges
z.number().min(0).max(100)

// Enums
z.enum(['option1', 'option2'])

// UUIDs
z.string().uuid('Invalid UUID')
```

### Sanitize User-Generated Content
**REQUIRED**: Sanitize content before storing or displaying.

```typescript
// For markdown content
import { sanitize } from 'dompurify'; // If using DOMPurify

// For plain text
const sanitizeText = (text: string) => {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
};
```

**React's Built-in XSS Protection:**
- React automatically escapes content in JSX
- Use `dangerouslySetInnerHTML` only when absolutely necessary
- Always sanitize before using `dangerouslySetInnerHTML`

## 4. Row Level Security (RLS)

### Never Bypass RLS Policies
**CRITICAL**: RLS policies are the last line of defense.

- RLS is enforced at database level
- Never disable RLS for convenience
- Always test with different user roles
- Verify RLS policies in migrations

**RLS Policy Pattern:**
```sql
-- Example RLS policy (from migrations)
CREATE POLICY "Users can view their own data"
ON public.user_data FOR SELECT
USING (auth.uid() = user_id);
```

**Testing RLS:**
- Test with different user accounts
- Verify users can only access their own data
- Verify admins can access appropriate data
- Test edge cases (deleted users, etc.)

### Use Security Definer Functions
For complex authorization logic, use security definer functions:

```sql
-- Example from migrations
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

## 5. Secrets and API Keys

### Never Commit Secrets
**CRITICAL**: Never commit API keys, secrets, or credentials.

**Environment Variables:**
```typescript
// ✅ Use environment variables
const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ❌ Never hardcode
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Environment Variable Rules:**
- Use `.env` files (not committed to git)
- Use `.env.example` to document required variables
- Never log secrets in console
- Use different keys for development/production

**Gitignore:**
```
.env
.env.local
.env.production
*.key
*.pem
```

### Secure API Calls
- Use HTTPS for all API calls
- Verify SSL certificates
- Don't expose sensitive data in URLs
- Use POST for sensitive operations (not GET)

## 6. XSS Protection

### Sanitize User Input
**REQUIRED**: Sanitize all user-generated content.

```typescript
// For displaying user content
export const UserContent = ({ content }: { content: string }) => {
  // React automatically escapes content
  return <div>{content}</div>; // Safe
};

// If you must use HTML
import DOMPurify from 'dompurify';

export const UserHTML = ({ html }: { html: string }) => {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
```

### Content Security Policy
- Set appropriate CSP headers
- Restrict inline scripts
- Use nonce or hash for allowed scripts

## 7. SQL Injection Protection

### Use Parameterized Queries
**MANDATORY**: Supabase handles this automatically, but be aware.

**✅ Safe (Supabase handles):**
```typescript
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('id', userId); // Parameterized automatically
```

**❌ Never do this (Supabase prevents, but don't try):**
```typescript
// Never concatenate user input into queries
const query = `SELECT * FROM table WHERE id = '${userId}'`; // DANGEROUS
```

## 8. CSRF Protection

### Use Same-Site Cookies
- Supabase handles CSRF protection
- Ensure cookies are set with SameSite attribute
- Use CSRF tokens for sensitive operations if needed

## 9. Rate Limiting

### Implement Rate Limiting
- Supabase provides rate limiting
- Implement additional rate limiting for sensitive operations
- Log and monitor rate limit violations

## 10. Error Handling Security

### Don't Expose Sensitive Information
**CRITICAL**: Never expose sensitive data in error messages.

```typescript
// ✅ Safe error handling
try {
  await operation();
} catch (error) {
  console.error('Operation failed:', error); // Log full error
  toast.error('Something went wrong. Please try again.'); // Generic user message
}

// ❌ Never expose sensitive info
catch (error) {
  toast.error(`Database error: ${error.message}`); // May expose sensitive info
}
```

**Error Message Rules:**
- Log full errors server-side
- Show generic messages to users
- Don't reveal system internals
- Don't expose database structure
- Don't reveal user existence (for login errors)

## 11. File Upload Security

### Validate File Uploads
```typescript
const validateFile = (file: File) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // Check file size (e.g., 5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File too large');
  }

  return true;
};
```

### Secure File Storage
- Store files in Supabase Storage
- Use RLS policies on storage buckets
- Validate file content (not just extension)
- Scan for malware if possible

## 12. Session Management

### Secure Session Handling
- Use Supabase Auth for session management
- Implement session timeout
- Clear sessions on logout
- Handle token refresh securely

## Security Checklist

Before deploying any feature:

- [ ] Authentication verified for all user operations
- [ ] Authorization checked (roles/permissions)
- [ ] Input validation with Zod schemas
- [ ] User content sanitized
- [ ] RLS policies tested
- [ ] No secrets in code
- [ ] Error messages don't expose sensitive info
- [ ] File uploads validated
- [ ] HTTPS used for all API calls
- [ ] Security tested with different user roles

## References

- Security policy: `SECURITY.md`
- Auth context: `src/contexts/AuthContext.tsx`
- User role hook: `src/hooks/useUserRole.ts`
- RLS policies: `supabase/migrations/`

