# @happy-fox/server-actions

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/happy-fox-devs/server-actions/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61dafb.svg)](https://reactjs.org/)
[![Bundle Size](https://img.shields.io/badge/bundle%20size-~1.5KB-green.svg)](https://github.com/happy-fox-devs/server-actions)
[![GitHub Stars](https://img.shields.io/github/stars/happy-fox-devs/server-actions?style=social)](https://github.com/happy-fox-devs/server-actions)

A comprehensive TypeScript library for managing React Server Actions with advanced features like automatic FormData transformation, data sanitization, caching, deduplication, and optimistic updates.

## ✨ Features

- 🔄 **Automatic Data Transformation**: Seamlessly convert between objects and FormData
- 🛡️ **Data Sanitization**: Automatically handle non-serializable types (Date, File, Blob)
- ⚡ **Advanced React Hook**: SWR-like functionality with caching and deduplication
- 🎯 **TypeScript Support**: Full type safety with generic types
- 🔧 **Flexible API**: Works with any server action pattern
- 📦 **Zero Dependencies**: Lightweight and focused (~1.5KB gzipped)

## 📦 Installation

```bash
# Install directly from GitHub
pnpm add github:happy-fox-devs/server-actions

# Or with npm
npm install github:happy-fox-devs/server-actions

# Or with yarn
yarn add github:happy-fox-devs/server-actions

# Specific version
pnpm add github:happy-fox-devs/server-actions#v0.1.0-beta.1
pnpm add react-server-actions-lib
```

## Requirements

- React 18.2.0+ (for stable Server Actions support)
- TypeScript 4.9+
- Node.js 18+ (recommended)

## Quick Start

### 1. Basic Server Action with Automatic Transformation

```tsx
// server/actions.ts
'use server'
import { withFormTransform } from 'react-server-actions-lib';

interface CreateUserInput {
  name: string;
  email: string;
  avatar?: File;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

async function createUserAction(formData: FormData) {
  // Your server logic here
  const user = await createUser(data);
  return user;
}

// Wrap with automatic transformation and sanitization
export const createUser = withFormTransform<User, CreateUserInput>(createUserAction);
```

### 2. Client-side Usage with React Hook

```tsx
// components/UserForm.tsx
'use client'
import { useSAR } from 'react-server-actions-lib';
import { createUser } from '@/server/actions';

export function UserForm() {
  const {
    data: user,
    loading,
    error,
    execute
  } = useSAR({
    action: createUser,
    onSuccess: (user) => {
      toast.success(`User ${user.name} created!`);
    }
  });

  const handleSubmit = async (formData: FormData) => {
    await execute(formData);
  };

  return (
    <form action={handleSubmit}>
      <input name="name" type="text" required />
      <input name="email" type="email" required />
      <input name="avatar" type="file" accept="image/*" />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### 3. Advanced Usage with Object Input

```tsx
// You can also send objects directly
const handleCreateUser = async () => {
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    profile: {
      age: 30,
      preferences: ['music', 'sports']
    },
    avatar: fileInput.files[0] // File object
  };

  await execute(userData); // Automatically converted to FormData
};
```

## API Reference

### Core Utilities

#### `objectToFormData(obj: Record<string, any>): FormData`

Converts nested objects to FormData with dot notation support.

```tsx
import { objectToFormData } from 'react-server-actions-lib';

const data = {
  user: {
    name: 'John',
    profile: { age: 30 }
  },
  tags: ['react', 'typescript']
};

const formData = objectToFormData(data);
// Creates: user.name=John, user.profile.age=30, tags.0=react, tags.1=typescript
```

#### `formDataToObject<T>(formData: FormData): T`

Converts FormData back to typed objects with nested structure reconstruction.

```tsx
import { formDataToObject } from 'react-server-actions-lib';

interface UserData {
  name: string;
  profile: {
    age: number;
  };
  tags: string[];
}

const obj = formDataToObject<UserData>(formData);
// Automatically reconstructs nested structure and converts types
```

#### `withFormTransform<TReturn, TInput>(serverAction): WrappedServerAction`

Wraps server actions with automatic FormData transformation and data sanitization.

```tsx
import { withFormTransform } from 'react-server-actions-lib';

const wrappedAction = withFormTransform<User, CreateUserInput>(async (formData) => {
  // Receives FormData, but you can work with it normally
  const data = formDataToObject<CreateUserInput>(formData);
  // Your logic here
  return user;
});
```

#### `serverActionRequest<T>(action, data): Promise<ServerActionResponse<T>>`

Client-side utility for executing server actions with flexible input.

```tsx
import { serverActionRequest } from 'react-server-actions-lib';

// Works with objects (automatically converted to FormData)
const response1 = await serverActionRequest(myAction, { name: 'John' });

// Works with FormData directly
const response2 = await serverActionRequest(myAction, formData);

// Works with no data
const response3 = await serverActionRequest(myAction);
```

### React Hook: `useSAR`

Advanced React hook with SWR-like features for server actions.

#### Basic Usage

```tsx
const {
  data,
  error,
  loading,
  execute,
  refetch,
  mutate,
  optimisticMutate,
  reset
} = useSAR({
  action: myServerAction,
  // ... options
});
```

#### Options

```tsx
interface SAROptions<T> {
  action: ServerAction<T>;                    // The server action to execute
  condition?: boolean;                        // Only execute if true
  cacheTime?: number;                        // Cache duration in ms (0 = no cache)
  revalidateOnMount?: boolean;               // Refetch when component mounts
  revalidateOnFocus?: boolean;               // Refetch when window gains focus
  dedupingInterval?: number;                 // Prevent rapid requests (ms)
  executeOnMount?: boolean;                  // Auto-execute on mount
  onSuccess?: (data: T) => void;             // Success callback
  onError?: (error: string) => void;         // Error callback
}
```

#### Advanced Features

```tsx
// With caching and revalidation
const { data, execute } = useSAR({
  action: fetchUserAction,
  cacheTime: 5000,           // Cache for 5 seconds
  revalidateOnFocus: true,   // Refetch when window gets focus
  revalidateOnMount: true,   // Refetch when component mounts
});

// With optimistic updates
const { optimisticMutate, execute } = useSAR({
  action: updateUserAction,
});

const handleUpdate = async (newName: string) => {
  // Optimistically update UI
  optimisticMutate((current) => ({ ...current, name: newName }));
  
  // Execute actual update
  await execute({ name: newName });
};

// With conditional execution
const { execute } = useSAR({
  action: secureAction,
  condition: user?.isAuthenticated, // Only execute if authenticated
});
```

### Response Helpers

#### `createSuccessResponse<T>(data: T, message?: string): ServerActionResponse<T>`

Creates a standardized success response.

```tsx
import { createSuccessResponse } from 'react-server-actions-lib';

return createSuccessResponse(user, 'User created successfully');
```

#### `createErrorResponse(error: Error | string, message?: string): ServerActionResponse<never>`

Creates a standardized error response.

```tsx
import { createErrorResponse } from 'react-server-actions-lib';

return createErrorResponse(error, 'Failed to create user');
```

### Types

#### `ServerActionResponse<T>`

Standardized response type for server actions.

```tsx
type ServerActionResponse<T> = 
  | { ok: true; data: T; message: string }
  | { ok: false; error: Error; message: string };
```

#### `Sanitized<T>`

Type utility that shows how types will be transformed during sanitization.

```tsx
type UserData = {
  name: string;
  createdAt: Date;        // → string (ISO format)
  avatar: File;           // → { name: string; size: number; type: string; _isFile: boolean }
};

type SanitizedUser = Sanitized<UserData>;
// Result: { name: string; createdAt: string; avatar: { name: string; size: number; type: string; _isFile: boolean } }
```

## Data Sanitization

The library automatically sanitizes data for client-server compatibility:

- **Date objects** → ISO strings (`date.toISOString()`)
- **File objects** → Metadata objects with `{ name, size, type, _isFile: true }`
- **Blob objects** → Metadata objects with `{ name: 'blob', size, type, _isFile: true }`
- **Nested objects and arrays** → Recursively processed

```tsx
const data = {
  name: 'John',
  createdAt: new Date(),
  avatar: fileObject,
  preferences: {
    theme: 'dark',
    notifications: true
  }
};

// After sanitization:
// {
//   name: 'John',
//   createdAt: '2023-12-01T10:30:00.000Z',
//   avatar: { name: 'avatar.jpg', size: 1024, type: 'image/jpeg', _isFile: true },
//   preferences: { theme: 'dark', notifications: true }
// }
```

## Examples

### Complete Form with File Upload

```tsx
'use client'
import { useSAR } from 'react-server-actions-lib';
import { uploadDocument } from '@/server/actions';

interface DocumentData {
  title: string;
  category: string;
  file: File;
  tags: string[];
}

export function DocumentUploadForm() {
  const {
    data: document,
    loading,
    error,
    execute
  } = useSAR({
    action: uploadDocument,
    onSuccess: (doc) => {
      toast.success(`Document "${doc.title}" uploaded successfully!`);
      router.push(`/documents/${doc.id}`);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error}`);
    }
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // Add tags as array
    const tags = formData.get('tags')?.toString().split(',') || [];
    formData.delete('tags');
    tags.forEach((tag, index) => {
      formData.append(`tags.${index}`, tag.trim());
    });

    await execute(formData);
  };

  // Or with object syntax:
  const handleObjectSubmit = async (data: DocumentData) => {
    await execute(data); // Automatically converted to FormData
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" type="text" required />
      <select name="category" required>
        <option value="contract">Contract</option>
        <option value="report">Report</option>
      </select>
      <input name="file" type="file" required />
      <input name="tags" placeholder="tag1, tag2, tag3" />
      <button type="submit" disabled={loading}>
        {loading ? 'Uploading...' : 'Upload Document'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### Data Fetching with Cache

```tsx
'use client'
import { useSAR } from 'react-server-actions-lib';
import { getUserPosts } from '@/server/actions';

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export function UserPosts({ userId }: { userId: string }) {
  const {
    data: posts,
    loading,
    error,
    refetch,
    mutate
  } = useSAR({
    action: getUserPosts,
    cacheTime: 30000, // Cache for 30 seconds
    revalidateOnFocus: true,
    executeOnMount: true,
    condition: !!userId
  });

  useEffect(() => {
    if (userId) {
      execute({ userId });
    }
  }, [userId]);

  const handleRefresh = () => {
    refetch(); // Bypasses cache
  };

  const handleOptimisticAdd = (newPost: Post) => {
    // Optimistically add post to UI
    mutate([...(posts || []), newPost]);
  };

  if (loading) return <PostsSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={handleRefresh} />;
  if (!posts?.length) return <EmptyState />;

  return (
    <div>
      <button onClick={handleRefresh}>Refresh</button>
      <PostsList posts={posts} onOptimisticAdd={handleOptimisticAdd} />
    </div>
  );
}
```

## Best Practices

### 1. Type Safety

Always define interfaces for your data:

```tsx
interface CreateUserInput {
  name: string;
  email: string;
  profile?: {
    age: number;
    bio?: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export const createUser = withFormTransform<User, CreateUserInput>(createUserAction);
```

### 2. Error Handling

Use the response helpers for consistent error handling:

```tsx
// server/actions.ts
'use server'
import { createSuccessResponse, createErrorResponse } from 'react-server-actions-lib';

export async function createUserAction(formData: FormData) {
  try {
    const user = await createUser(data);
    return createSuccessResponse(user, 'User created successfully');
  } catch (error) {
    return createErrorResponse(error, 'Failed to create user');
  }
}
```

### 3. Caching Strategy

Use appropriate cache times based on data freshness requirements:

```tsx
// Static data - long cache
const { data: categories } = useSAR({
  action: getCategoriesAction,
  cacheTime: 300000, // 5 minutes
});

// User-specific data - short cache
const { data: notifications } = useSAR({
  action: getNotificationsAction,
  cacheTime: 30000, // 30 seconds
  revalidateOnFocus: true,
});

// Real-time data - no cache
const { data: liveData } = useSAR({
  action: getLiveDataAction,
  cacheTime: 0, // No cache
  revalidateInterval: 5000, // Poll every 5 seconds
});
```

### 4. Optimistic Updates

Use optimistic updates for better UX:

```tsx
const { data, optimisticMutate, execute } = useSAR({
  action: updatePostAction,
});

const handleLike = async (postId: string) => {
  // Optimistically update UI
  optimisticMutate((current) => ({
    ...current,
    likes: current.likes + 1,
    isLiked: true
  }));

  // Execute actual update
  const response = await execute({ postId, action: 'like' });
  
  // Handle potential revert on error is automatic
};
```

## Migration Guide

### From Traditional Server Actions

Before:
```tsx
// Traditional approach
async function handleSubmit(formData: FormData) {
  const result = await myServerAction(formData);
  if (result.success) {
    // handle success
  } else {
    // handle error
  }
}
```

After:
```tsx
// With library
const { execute, loading, error } = useSAR({
  action: myServerAction,
  onSuccess: (data) => {
    // handle success
  }
});

const handleSubmit = (formData: FormData) => {
  execute(formData);
};
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Core transformation utilities
- React hook with SWR-like features
- TypeScript support
- Data sanitization
- Comprehensive documentation