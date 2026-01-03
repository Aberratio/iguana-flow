# Database Operations Rules

## Core Principle: Maximum Data Safety

**CRITICAL**: Database operations must be safe, reversible, and never result in data loss.

## 1. Data Safety Requirements

### Soft Deletes (Never Hard Delete)
**MANDATORY**: Use soft deletes for all user-generated and important data.

**Pattern:**
- Tables have `deleted_at` column (TIMESTAMPTZ, nullable)
- Set `deleted_at = now()` instead of DELETE
- Always filter out soft-deleted records in queries
- Only admins can permanently delete (if needed)

**Soft Delete Implementation:**
```typescript
// ✅ Soft delete
const softDelete = async (id: string) => {
  const { error } = await supabase
    .from('table')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

// ✅ Query with soft delete filter
const getActiveRecords = async () => {
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .is('deleted_at', null); // Only active records

  if (error) throw error;
  return data;
};
```

**Tables with Soft Delete:**
- `training_library` - has `deleted_at`
- `challenges` - has `deleted_at`
- `figures` - has `deleted_at`
- `sport_levels` - has `deleted_at`

**Always Check:**
```typescript
// ✅ Always filter soft-deleted records
.select('*')
.is('deleted_at', null) // CRITICAL: Filter deleted records
```

### Hard Delete Restrictions
**FORBIDDEN**: Never use hard DELETE without:
1. Explicit confirmation from user
2. Backup of data
3. Admin-only access
4. Audit logging

**If Hard Delete is Absolutely Necessary:**
```typescript
// Only in admin functions, with confirmation
const hardDelete = async (id: string, confirmed: boolean) => {
  if (!confirmed) {
    throw new Error('Deletion must be confirmed');
  }

  // 1. Backup data first
  const { data: backup } = await supabase
    .from('table')
    .select('*')
    .eq('id', id)
    .single();

  // 2. Log deletion
  await logDeletion(backup);

  // 3. Then delete
  const { error } = await supabase
    .from('table')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
```

## 2. Transactions for Multi-Step Operations

### Use Transactions for Critical Operations
**REQUIRED**: Use database transactions for operations that must succeed or fail together.

**Supabase Transaction Pattern:**
```typescript
// For multi-step operations, use RPC functions with transactions
const createChallengeWithDays = async (challengeData: ChallengeData) => {
  // Use Edge Function or RPC that handles transaction
  const { data, error } = await supabase.rpc('create_challenge_with_days', {
    challenge_data: challengeData,
    days_data: daysData,
  });

  if (error) throw error;
  return data;
};
```

**Edge Function Transaction Example:**
```typescript
// In Supabase Edge Function
const { data, error } = await supabaseClient.rpc('pg_transaction', {
  // Transaction logic in database function
});
```

**Client-Side Multi-Step Pattern:**
```typescript
// For operations that must be atomic
const updateUserProfile = async (profileData: ProfileData) => {
  // 1. Validate data
  const validated = validateProfileData(profileData);

  // 2. Check permissions
  if (!canUpdateProfile) {
    throw new Error('Insufficient permissions');
  }

  // 3. Perform update (Supabase handles transaction)
  const { data, error } = await supabase
    .from('profiles')
    .update(validated)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    // Rollback any side effects if needed
    throw error;
  }

  return data;
};
```

## 3. Error Handling

### Always Handle Supabase Errors
**MANDATORY**: Every database operation must handle errors gracefully.

```typescript
// ✅ Proper error handling
const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('table')
      .select('*');

    if (error) {
      console.error('Database error:', error);
      
      // Handle specific error codes
      if (error.code === 'PGRST116') {
        // No rows returned - not necessarily an error
        return [];
      }
      
      if (error.code === '23505') {
        // Unique constraint violation
        throw new Error('Record already exists');
      }

      throw error;
    }

    return data || [];
  } catch (error) {
    // Log for debugging
    console.error('Operation failed:', error);
    
    // User-friendly message
    toast.error('Failed to load data. Please try again.');
    
    // Return safe fallback
    return [];
  }
};
```

### Common Error Codes
```typescript
// Handle common Supabase error codes
const handleSupabaseError = (error: any) => {
  switch (error.code) {
    case 'PGRST116':
      // No rows found - use .maybeSingle() instead
      return null;
    case '23505':
      // Unique constraint violation
      throw new Error('This record already exists');
    case '23503':
      // Foreign key violation
      throw new Error('Referenced record does not exist');
    case '42501':
      // Insufficient privilege (RLS)
      throw new Error('You do not have permission');
    default:
      throw error;
  }
};
```

### User-Friendly Error Messages
**REQUIRED**: Never expose database internals to users.

```typescript
// ✅ User-friendly errors
try {
  await operation();
} catch (error) {
  console.error('Technical error:', error); // Log full error
  
  // Generic user message
  toast.error('Something went wrong. Please try again.');
  
  // Or specific but safe message
  if (error.message.includes('permission')) {
    toast.error('You do not have permission to perform this action.');
  }
}
```

## 4. Query Patterns

### Use Parameterized Queries
**AUTOMATIC**: Supabase handles parameterization, but be aware.

```typescript
// ✅ Safe - Supabase handles parameterization
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('id', userId) // Parameterized automatically
  .eq('status', 'active'); // Parameterized automatically
```

### Use .maybeSingle() for Optional Records
**REQUIRED**: Use `.maybeSingle()` when record might not exist.

```typescript
// ✅ Use maybeSingle when record might not exist
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .maybeSingle(); // Returns null if not found, doesn't throw

if (error) throw error;
if (!data) {
  // Handle missing record
  return null;
}
```

**vs .single():**
```typescript
// ⚠️ .single() throws error if no record found
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single(); // Throws PGRST116 if not found

// Use only when you're certain record exists
```

### Always Check RLS Policies
**MANDATORY**: Verify RLS policies before queries.

- RLS is enforced automatically by Supabase
- Test queries with different user roles
- Never assume data access without testing
- Check RLS policies in migrations

**Testing RLS:**
```typescript
// Test with different users
const testRLS = async () => {
  // Test as regular user
  const { data: userData } = await supabase
    .from('table')
    .select('*');
  // Should only return user's own data

  // Test as admin (if applicable)
  // Should return all data
};
```

## 5. Data Validation Before Operations

### Validate Data Before Database Operations
**REQUIRED**: Validate all data before database operations.

```typescript
import { z } from 'zod';

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30),
  bio: z.string().max(500).optional(),
});

const updateProfile = async (data: unknown) => {
  // 1. Validate
  const validated = updateProfileSchema.parse(data);

  // 2. Check permissions
  if (!canUpdate) {
    throw new Error('Insufficient permissions');
  }

  // 3. Perform operation
  const { data: result, error } = await supabase
    .from('profiles')
    .update(validated)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return result;
};
```

## 6. Backup Critical Data

### Backup Before Destructive Operations
**REQUIRED**: Backup data before any destructive operation.

```typescript
const updateCriticalData = async (id: string, newData: Data) => {
  // 1. Fetch current data (backup)
  const { data: currentData } = await supabase
    .from('table')
    .select('*')
    .eq('id', id)
    .single();

  if (!currentData) {
    throw new Error('Record not found');
  }

  // 2. Store backup (optional - for audit)
  await storeBackup(currentData);

  // 3. Perform update
  const { data: updatedData, error } = await supabase
    .from('table')
    .update(newData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    // Could restore from backup if needed
    throw error;
  }

  return updatedData;
};
```

## 7. Query Optimization

### Efficient Queries
**REQUIRED**: Write efficient queries to avoid performance issues.

```typescript
// ✅ Efficient - select only needed columns
const { data } = await supabase
  .from('posts')
  .select('id, content, created_at') // Only needed fields
  .order('created_at', { ascending: false })
  .limit(20);

// ❌ Inefficient - select all columns
const { data } = await supabase
  .from('posts')
  .select('*') // All columns
  .order('created_at', { ascending: false })
  .limit(20);
```

**Use Indexes:**
- Database indexes are defined in migrations
- Use indexed columns in WHERE clauses
- Avoid full table scans

**Pagination:**
```typescript
// ✅ Use pagination for large datasets
const fetchPaginated = async (page: number, pageSize: number = 20) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('table')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return data;
};
```

## 8. Real-time Subscriptions

### Properly Manage Subscriptions
**REQUIRED**: Clean up subscriptions to prevent memory leaks.

```typescript
useEffect(() => {
  const channel = supabase
    .channel('table-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table',
    }, (payload) => {
      // Handle change
      handleChange(payload);
    })
    .subscribe();

  // CRITICAL: Cleanup subscription
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## 9. Data Migration Safety

### Safe Migrations
**REQUIRED**: Migrations must be safe and reversible.

- Test migrations on development database first
- Never delete columns without migration path
- Use `IF EXISTS` / `IF NOT EXISTS` where appropriate
- Add new columns as nullable first, then populate, then make required
- Document breaking changes

**Migration Pattern:**
```sql
-- ✅ Safe migration
-- 1. Add new column as nullable
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS new_column TEXT;

-- 2. Populate with default values
UPDATE table_name SET new_column = 'default' WHERE new_column IS NULL;

-- 3. Make required (if needed)
ALTER TABLE table_name ALTER COLUMN new_column SET NOT NULL;
```

## 10. Database Operation Checklist

Before any database operation:

- [ ] Soft delete implemented (if deletion needed)
- [ ] Error handling in place
- [ ] Data validated before operation
- [ ] RLS policies verified
- [ ] Query optimized (select only needed columns)
- [ ] Soft-deleted records filtered out
- [ ] Transaction used for multi-step operations
- [ ] Backup created for destructive operations
- [ ] User-friendly error messages
- [ ] Tested with different user roles

## References

- Soft delete columns: Check migrations for `deleted_at` columns
- RLS policies: `supabase/migrations/`
- Error handling: `src/lib/errorHandler.ts`
- Supabase client: `src/integrations/supabase/client.ts`

