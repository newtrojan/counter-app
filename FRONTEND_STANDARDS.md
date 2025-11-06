# Frontend Development Standards

## 📋 Overview

This document defines the standards, patterns, and best practices for frontend development in this project.

---

## 🏗️ Architecture Principles

### **1. Component Structure**
```
src/
├── components/
│   ├── ui/              # shadcn/ui components (don't modify)
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   ├── features/        # Feature-specific components
│   └── shared/          # Shared/reusable components
├── pages/               # Page components (one per route)
├── hooks/               # Custom React hooks
├── lib/                 # Utilities, API client, helpers
├── store/               # Zustand stores (one per domain)
├── types/               # TypeScript types
└── api/                 # API functions (organized by domain)
```

### **2. File Naming Conventions**
- **Components**: PascalCase (e.g., `UserProfile.tsx`, `DashboardLayout.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`, `useUsers.ts`)
- **Utilities**: camelCase (e.g., `api-client.ts`, `utils.ts`)
- **Types**: camelCase (e.g., `auth.ts`, `user.ts`)
- **Stores**: kebab-case with `-store` suffix (e.g., `auth-store.ts`, `user-store.ts`)

### **3. Component Patterns**

#### ✅ DO: Functional Components with TypeScript
```typescript
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // Component logic
  return <div>...</div>;
}
```

#### ❌ DON'T: Class Components
```typescript
// Don't use class components
class UserProfile extends React.Component { ... }
```

#### ✅ DO: Named Exports
```typescript
export function UserProfile() { ... }
```

#### ❌ DON'T: Default Exports (except for pages)
```typescript
// Only use default export for page components
export default function LoginPage() { ... }
```

---

## 🎯 TanStack Query (React Query) Standards

### **1. Query Organization**
```typescript
// src/api/users.ts
export const userApi = {
  getUsers: () => apiClient.get<User[]>('/users'),
  getUser: (id: string) => apiClient.get<User>(`/users/${id}`),
  createUser: (data: CreateUserDto) => apiClient.post<User>('/users', data),
  updateUser: (id: string, data: UpdateUserDto) =>
    apiClient.patch<User>(`/users/${id}`, data),
  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),
};
```

### **2. Custom Hooks Pattern**
```typescript
// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/users';

// Query Keys (centralized)
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// GET: Fetch all users
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => userApi.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// GET: Fetch single user
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userApi.getUser(id),
    enabled: !!id, // Only fetch if id exists
  });
}

// POST: Create user
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// PATCH: Update user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      userApi.updateUser(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// DELETE: Delete user
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

### **3. Query Best Practices**

#### ✅ Always Use Query Keys Factory
```typescript
// ✅ Good - Centralized, type-safe, consistent
export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};
```

#### ❌ Don't Hardcode Query Keys
```typescript
// ❌ Bad - Inconsistent, error-prone
useQuery({ queryKey: ['users', id], ... });
```

#### ✅ Set Appropriate Stale Times
```typescript
// ✅ Good - Data that changes frequently
useQuery({
  queryKey: userKeys.lists(),
  queryFn: getUsers,
  staleTime: 30 * 1000, // 30 seconds
});

// ✅ Good - Data that rarely changes
useQuery({
  queryKey: settingsKeys.all,
  queryFn: getSettings,
  staleTime: 10 * 60 * 1000, // 10 minutes
});
```

#### ✅ Use Optimistic Updates for Better UX
```typescript
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => userApi.updateUser(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(userKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(userKeys.detail(id), (old: User) => ({
        ...old,
        ...data,
      }));

      return { previousUser };
    },

    // Rollback on error
    onError: (err, { id }, context) => {
      queryClient.setQueryData(userKeys.detail(id), context?.previousUser);
    },

    // Always refetch after success/error
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}
```

---

## 🛡️ Security Standards

### **1. XSS Prevention**

#### ✅ React Auto-Escapes (Safe by Default)
```typescript
// ✅ Safe - React automatically escapes
<div>{user.name}</div>
<div>{user.description}</div>
```

#### ⚠️ Dangerous: dangerouslySetInnerHTML
```typescript
// ⚠️ Only use if absolutely necessary and sanitize!
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(htmlContent)
}} />
```

### **2. Authentication & Authorization**

#### ✅ Store Tokens Securely
```typescript
// ✅ Good - Use secure token storage
const token = tokenStorage.getAccessToken();

// ❌ Bad - Don't store in plain localStorage without encryption
localStorage.setItem('token', token); // Only for non-sensitive data
```

#### ✅ Protect Sensitive Operations
```typescript
// ✅ Check auth state before sensitive operations
const { isAuthenticated, isAdmin } = useAuthStore();

if (!isAuthenticated) {
  return <Navigate to="/login" />;
}

if (!isAdmin()) {
  return <Navigate to="/dashboard" />;
}
```

#### ✅ Clear Sensitive Data on Logout
```typescript
const logout = async () => {
  await authApi.logout();
  tokenStorage.clearTokens();
  queryClient.clear(); // Clear all cached data
  navigate('/login');
};
```

### **3. CORS & API Security**

#### ✅ Use Proxy in Development
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

#### ✅ Validate API Responses
```typescript
// ✅ Always validate API responses
const { data } = await apiClient.get<User>('/users/me');
if (!data || !data.id) {
  throw new Error('Invalid response');
}
```

### **4. Input Validation (Zod)**

#### ✅ Validate All User Inputs
```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;
```

#### ✅ Use with React Hook Form
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});
```

---

## 🎨 UI/UX Standards

### **1. Use shadcn/ui Components**

#### ✅ Install Components as Needed
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
```

#### ✅ Customize in tailwind.config.js
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
      },
    },
  },
};
```

### **2. Responsive Design**

#### ✅ Mobile-First Approach
```typescript
<div className="flex flex-col md:flex-row">
  <aside className="w-full md:w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

### **3. Loading States**

#### ✅ Show Loading Indicators
```typescript
const { data, isLoading, isError } = useUsers();

if (isLoading) {
  return <LoadingSpinner />;
}

if (isError) {
  return <ErrorMessage message="Failed to load users" />;
}

return <UserList users={data} />;
```

### **4. Error Handling**

#### ✅ User-Friendly Error Messages
```typescript
import { toast } from '@/components/ui/use-toast';

try {
  await createUser(data);
  toast({
    title: 'Success',
    description: 'User created successfully',
  });
} catch (error) {
  toast({
    title: 'Error',
    description: error.message || 'Something went wrong',
    variant: 'destructive',
  });
}
```

---

## 📝 Form Standards

### **1. Form Structure**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// 1. Define schema
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

// 2. Create form component
export function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
    });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}
```

---

## 🧪 Testing Standards

### **1. Test File Naming**
- Unit tests: `ComponentName.test.tsx`
- Integration tests: `feature.integration.test.tsx`

### **2. What to Test**
- ✅ User interactions (button clicks, form submissions)
- ✅ Conditional rendering
- ✅ Error states
- ✅ Loading states
- ❌ Don't test implementation details

### **3. Testing Pattern**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows validation errors', async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

---

## 📦 Performance Standards

### **1. Code Splitting**
```typescript
// ✅ Lazy load routes
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));

<Route path="/admin" element={
  <Suspense fallback={<LoadingSpinner />}>
    <AdminDashboard />
  </Suspense>
} />
```

### **2. Memoization**
```typescript
import { memo, useMemo, useCallback } from 'react';

// ✅ Memoize expensive computations
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

// ✅ Memoize callbacks passed to children
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

// ✅ Memoize components that rarely change
export const UserCard = memo(({ user }: { user: User }) => {
  return <div>{user.name}</div>;
});
```

### **3. Image Optimization**
```typescript
// ✅ Use appropriate image formats
<img src="/avatar.webp" alt="Avatar" loading="lazy" />

// ✅ Responsive images
<img
  srcSet="/avatar-small.webp 400w, /avatar-large.webp 800w"
  sizes="(max-width: 600px) 400px, 800px"
  src="/avatar-large.webp"
  alt="Avatar"
/>
```

---

## 📖 Documentation Standards

### **1. Component Documentation**
```typescript
/**
 * UserProfile displays user information and allows editing
 *
 * @param userId - The ID of the user to display
 * @param onUpdate - Callback fired when user is updated
 *
 * @example
 * ```tsx
 * <UserProfile
 *   userId="123"
 *   onUpdate={(user) => console.log('Updated', user)}
 * />
 * ```
 */
export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // ...
}
```

### **2. Hook Documentation**
```typescript
/**
 * Fetches and caches user data
 *
 * @param id - User ID
 * @returns Query result with user data
 *
 * @example
 * ```tsx
 * const { data: user, isLoading } = useUser('123');
 * ```
 */
export function useUser(id: string) {
  // ...
}
```

---

## ✅ Code Review Checklist

Before submitting a PR, ensure:

- [ ] All components are typed with TypeScript
- [ ] No `any` types (use `unknown` if necessary)
- [ ] Forms use React Hook Form + Zod validation
- [ ] API calls use TanStack Query with proper error handling
- [ ] Query keys are centralized and follow factory pattern
- [ ] Loading and error states are handled
- [ ] Components are responsive (mobile-first)
- [ ] Sensitive data is not logged or exposed
- [ ] No console.log statements in production code
- [ ] Code is formatted (Prettier)
- [ ] No ESLint errors
- [ ] Tests are written for new features
- [ ] Documentation is updated

---

## 🚫 Common Mistakes to Avoid

### ❌ Don't Fetch Inside Components
```typescript
// ❌ Bad
function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/users/me').then(res => res.json()).then(setUser);
  }, []);

  return <div>{user?.name}</div>;
}

// ✅ Good
function UserProfile() {
  const { data: user } = useUser('me');
  return <div>{user?.name}</div>;
}
```

### ❌ Don't Mutate State Directly
```typescript
// ❌ Bad
const [users, setUsers] = useState([]);
users.push(newUser); // Mutation!

// ✅ Good
setUsers(prev => [...prev, newUser]);
```

### ❌ Don't Forget Error Boundaries
```typescript
// ✅ Wrap app in error boundary
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

---

**Follow these standards to ensure consistent, secure, and maintainable frontend code! 🚀**
