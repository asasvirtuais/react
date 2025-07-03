# @asasvirtuais/react

A comprehensive React TypeScript library for building CRUD (Create, Read, Update, Delete) applications with advanced form management, field handling, and state management capabilities.

## Features

- 🚀 **Modern React**: Built with React 19+ and TypeScript
- 📝 **Advanced Form Management**: Complete form handling with validation and submission
- 🔧 **Field Management**: Advanced field registration and state management
- 🗄️ **CRUD Operations**: Database abstraction with Zod schema validation
- 🎯 **Type Safety**: Full TypeScript support with strict typing
- 📦 **Modular Design**: Use only what you need
- 🔄 **State Management**: Indexed data management with automatic updates
- ⚡ **Performance**: Optimized with React hooks and context

## Installation

```bash
npm install @asasvirtuais/react
```

### Peer Dependencies

This library requires the following peer dependencies:

```bash
npm install @asasvirtuais/crud react zod
```

## Quick Start

### Basic Form Management

```tsx
import React from 'react';
import { FormProvider, FieldsProvider, useForm, useFields } from '@asasvirtuais/react';

interface UserForm {
  name: string;
  email: string;
  age: number;
}

function MyForm() {
  const form = useForm<UserForm, { success: boolean }>();
  const fields = useFields<UserForm>();

  return (
    <form onSubmit={form.submit}>
      <input
        {...fields.register('name')}
        placeholder="Name"
        type="text"
      />
      <input
        {...fields.register('email')}
        placeholder="Email"
        type="email"
      />
      <input
        {...fields.register('age')}
        placeholder="Age"
        type="number"
      />
      <button type="submit" disabled={form.loading}>
        {form.loading ? 'Submitting...' : 'Submit'}
      </button>
      {form.error && <p>Error: {form.error.message}</p>}
      {form.result && <p>Success!</p>}
    </form>
  );
}

function App() {
  const handleSubmit = async (data: UserForm) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Form submitted:', data);
    return { success: true };
  };

  return (
    <FieldsProvider<UserForm> defaults={{ name: '', email: '', age: 0 }}>
      <FormProvider<UserForm, { success: boolean }> onSubmit={handleSubmit}>
        <MyForm />
      </FormProvider>
    </FieldsProvider>
  );
}
```

### CRUD Operations with Database

```tsx
import React from 'react';
import { z } from 'zod';
import { database } from '@asasvirtuais/react';
import { CRUD } from '@asasvirtuais/crud';

// Define your schemas
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.date(),
});

const UserWriteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// Define your database structure
const dbStructure = {
  users: {
    readable: UserSchema,
    writable: UserWriteSchema,
  },
};

// Mock CRUD operations
const crudOperations: CRUD<z.infer<typeof UserSchema>, z.infer<typeof UserWriteSchema>> = {
  find: async ({ id }) => {
    // Mock implementation
    return { id, name: 'John Doe', email: 'john@example.com', createdAt: new Date() };
  },
  create: async ({ data }) => {
    // Mock implementation
    return { 
      id: crypto.randomUUID(), 
      ...data, 
      createdAt: new Date() 
    };
  },
  update: async ({ id, data }) => {
    // Mock implementation
    return { 
      id, 
      name: data.name || 'Updated Name', 
      email: data.email || 'updated@example.com', 
      createdAt: new Date() 
    };
  },
  remove: async ({ id }) => {
    // Mock implementation
    return { id, name: 'Deleted User', email: 'deleted@example.com', createdAt: new Date() };
  },
  list: async ({ filters, pagination }) => {
    // Mock implementation
    return [
      { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date() },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date() },
    ];
  },
};

// Create database instance
const db = database(dbStructure, crudOperations);

// Usage in components
function UserList() {
  const users = db.useTable('users');
  
  React.useEffect(() => {
    users.list.trigger({});
  }, []);

  return (
    <div>
      <h2>Users</h2>
      {users.loading && <p>Loading...</p>}
      {users.error && <p>Error: {users.error.message}</p>}
      <ul>
        {users.array.map(user => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreateUserForm() {
  const form = db.useCreateForm('users');
  
  return (
    <db.CreateForm
      table="users"
      onSuccess={(user) => console.log('User created:', user)}
    >
      <form onSubmit={form.submit}>
        <input
          {...form.register('name')}
          placeholder="Name"
          required
        />
        <input
          {...form.register('email')}
          placeholder="Email"
          type="email"
          required
        />
        <button type="submit" disabled={form.loading}>
          Create User
        </button>
      </form>
    </db.CreateForm>
  );
}

function App() {
  const DatabaseProvider = db.DatabaseProvider;
  const useTableProvider = db.useTableProvider;
  
  return (
    <DatabaseProvider
      users={useTableProvider({ table: 'users' })}
    >
      <UserList />
      <CreateUserForm />
    </DatabaseProvider>
  );
}
```

## API Documentation

### Core Hooks

#### `useAction<Props, Result, Defaults>`

A hook for handling async operations with loading states, error handling, and result management.

```tsx
const action = useAction(
  async (props: { id: string }) => {
    const response = await fetch(`/api/users/${props.id}`);
    return response.json();
  },
  {
    defaults: { id: '' },
    onSuccess: (result) => console.log('Success:', result),
    autoTrigger: true,
  }
);

// Usage
const handleClick = () => action.trigger({ id: 'user-123' });
```

**Parameters:**
- `action`: Async function to execute
- `options`: Configuration object
  - `defaults`: Default values for props
  - `onSuccess`: Success callback
  - `autoTrigger`: Auto-execute on mount

**Returns:**
- `trigger`: Function to execute the action
- `loading`: Boolean loading state
- `error`: Error object if failed
- `result`: Result data if successful
- `defaults`: Current default values
- `setDefaults`: Function to update defaults

#### `useIndex<T>`

A hook for managing indexed data with CRUD operations.

```tsx
const index = useIndex<User>({
  'user-1': { id: 'user-1', name: 'John' },
  'user-2': { id: 'user-2', name: 'Jane' },
});

// Usage
index.set({ id: 'user-3', name: 'Bob' }); // Add/update
index.remove({ id: 'user-1', name: 'John' }); // Remove
console.log(index.array); // Get as array
```

**Parameters:**
- `initialValue`: Initial indexed data

**Returns:**
- `index`: Current indexed data
- `array`: Data as array
- `set`: Add/update items
- `remove`: Remove items
- `setIndex`: Replace entire index

### Form Management

#### `FormProvider<Fields, Result>`

Provider component for form state management.

```tsx
<FormProvider<UserForm, ApiResponse> onSubmit={handleSubmit}>
  <MyForm />
</FormProvider>
```

**Props:**
- `onSubmit`: Async function called on form submission
- `children`: React children

#### `useForm<Fields, Result>`

Hook to access form state and methods.

```tsx
const form = useForm<UserForm, ApiResponse>();

// Methods
form.submit(); // Submit the form
form.loading; // Loading state
form.error; // Error state
form.result; // Result data
```

### Field Management

#### `FieldsProvider<T>`

Provider for managing form fields.

```tsx
<FieldsProvider<UserForm> defaults={{ name: '', email: '' }}>
  <MyForm />
</FieldsProvider>
```

**Props:**
- `defaults`: Default field values
- `children`: React children

#### `useFields<T>`

Hook to access field state and methods.

```tsx
const fields = useFields<UserForm>();

// Methods
const nameProps = fields.register('name'); // Get field props
fields.setField('name', 'John'); // Set field value
fields.setFields({ name: 'John', email: 'john@example.com' }); // Set multiple fields
```

### CRUD Database

#### `database<Database>(structure, operations)`

Creates a database instance with type-safe CRUD operations.

```tsx
const db = database(
  {
    users: { readable: UserSchema, writable: UserWriteSchema },
    posts: { readable: PostSchema, writable: PostWriteSchema },
  },
  crudOperations
);
```

**Parameters:**
- `structure`: Database table definitions with Zod schemas
- `operations`: CRUD operation implementations

**Returns:**
- `DatabaseProvider`: Context provider
- `useDatabase`: Hook to access all tables
- `useTable`: Hook to access specific table
- `CreateForm`: Component for create forms
- `UpdateForm`: Component for update forms
- `FilterForm`: Component for filter forms
- Various form hooks

### Store Management

#### `StoreProvider<T>`

Provider for managing multiple indexed stores.

```tsx
<StoreProvider
  users={[{ id: '1', name: 'John' }]}
  posts={[{ id: '1', title: 'Hello World' }]}
>
  <App />
</StoreProvider>
```

#### `useStore<T>`

Hook to access store data.

```tsx
const store = useStore<User>();
const userStore = store.users; // Returns useIndex result
```

### Context Utilities

#### `createContextFromHook<Props, Result>`

Utility to create context provider and hook from a custom hook.

```tsx
const useCustomHook = (props: Props) => {
  // Custom hook logic
  return result;
};

const [CustomProvider, useCustom] = createContextFromHook(useCustomHook);
```

## Advanced Examples

### Complex Form with Validation

```tsx
import React from 'react';
import { z } from 'zod';
import { FormProvider, FieldsProvider, useForm, useFields } from '@asasvirtuais/react';

const ContactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  subscribe: z.boolean(),
});

type ContactForm = z.infer<typeof ContactFormSchema>;

function ContactFormComponent() {
  const form = useForm<ContactForm, { success: boolean; id: string }>();
  const fields = useFields<ContactForm>();
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateField = (name: keyof ContactForm, value: any) => {
    try {
      ContactFormSchema.shape[name].parse(value);
      setErrors(prev => ({ ...prev, [name]: '' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [name]: error.errors[0].message }));
      }
    }
  };

  const handleFieldChange = (name: keyof ContactForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    fields.setField(name, value);
    validateField(name, value);
  };

  return (
    <form onSubmit={form.submit} className="contact-form">
      <div className="form-group">
        <label htmlFor="firstName">First Name *</label>
        <input
          id="firstName"
          type="text"
          value={fields.fields?.firstName || ''}
          onChange={handleFieldChange('firstName')}
          className={errors.firstName ? 'error' : ''}
        />
        {errors.firstName && <span className="error-message">{errors.firstName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="lastName">Last Name *</label>
        <input
          id="lastName"
          type="text"
          value={fields.fields?.lastName || ''}
          onChange={handleFieldChange('lastName')}
          className={errors.lastName ? 'error' : ''}
        />
        {errors.lastName && <span className="error-message">{errors.lastName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          value={fields.fields?.email || ''}
          onChange={handleFieldChange('email')}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone *</label>
        <input
          id="phone"
          type="tel"
          value={fields.fields?.phone || ''}
          onChange={handleFieldChange('phone')}
          className={errors.phone ? 'error' : ''}
        />
        {errors.phone && <span className="error-message">{errors.phone}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="message">Message *</label>
        <textarea
          id="message"
          value={fields.fields?.message || ''}
          onChange={handleFieldChange('message')}
          className={errors.message ? 'error' : ''}
          rows={4}
        />
        {errors.message && <span className="error-message">{errors.message}</span>}
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={fields.fields?.subscribe || false}
            onChange={handleFieldChange('subscribe')}
          />
          Subscribe to newsletter
        </label>
      </div>

      <button 
        type="submit" 
        disabled={form.loading || Object.values(errors).some(Boolean)}
      >
        {form.loading ? 'Sending...' : 'Send Message'}
      </button>

      {form.error && (
        <div className="error-message">
          Failed to send message: {form.error.message}
        </div>
      )}

      {form.result && (
        <div className="success-message">
          Message sent successfully! Reference ID: {form.result.id}
        </div>
      )}
    </form>
  );
}

function ContactFormApp() {
  const handleSubmit = async (data: ContactForm) => {
    // Validate the entire form
    const validationResult = ContactFormSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error('Please fix the validation errors');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random success/failure
    if (Math.random() > 0.8) {
      throw new Error('Server error occurred');
    }

    return {
      success: true,
      id: `MSG-${Date.now()}`,
    };
  };

  return (
    <FieldsProvider<ContactForm> 
      defaults={{
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: '',
        subscribe: false,
      }}
    >
      <FormProvider<ContactForm, { success: boolean; id: string }> 
        onSubmit={handleSubmit}
      >
        <ContactFormComponent />
      </FormProvider>
    </FieldsProvider>
  );
}
```

### Real-time Data Management

```tsx
import React from 'react';
import { z } from 'zod';
import { database, useAction } from '@asasvirtuais/react';

const MessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  timestamp: z.date(),
  edited: z.boolean(),
});

const MessageWriteSchema = z.object({
  content: z.string().min(1).max(500),
  authorId: z.string(),
  authorName: z.string(),
});

const db = database(
  {
    messages: {
      readable: MessageSchema,
      writable: MessageWriteSchema,
    },
  },
  {
    find: async ({ id, table }) => {
      const response = await fetch(`/api/${table}/${id}`);
      return response.json();
    },
    create: async ({ data, table }) => {
      const response = await fetch(`/api/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    update: async ({ id, data, table }) => {
      const response = await fetch(`/api/${table}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    remove: async ({ id, table }) => {
      const response = await fetch(`/api/${table}/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    list: async ({ filters, pagination, table }) => {
      const params = new URLSearchParams();
      if (filters) params.append('filters', JSON.stringify(filters));
      if (pagination) params.append('pagination', JSON.stringify(pagination));
      
      const response = await fetch(`/api/${table}?${params}`);
      return response.json();
    },
  }
);

function ChatRoom() {
  const messages = db.useTable('messages');
  const [currentUser] = React.useState({ id: 'user-1', name: 'John Doe' });

  // Real-time updates simulation
  const pollMessages = useAction(
    async () => {
      return messages.list.trigger({
        pagination: { limit: 50, offset: 0 },
        filters: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      });
    },
    { autoTrigger: true }
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      pollMessages.trigger();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="chat-room">
      <div className="messages">
        {messages.array
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .map(message => (
            <div key={message.id} className="message">
              <strong>{message.authorName}</strong>
              <span className="timestamp">
                {message.timestamp.toLocaleTimeString()}
              </span>
              <p>{message.content}</p>
              {message.edited && <small>edited</small>}
            </div>
          ))}
      </div>
      
      <db.CreateForm
        table="messages"
        defaults={{
          authorId: currentUser.id,
          authorName: currentUser.name,
          content: '',
        }}
        onSuccess={(message) => {
          console.log('Message sent:', message);
        }}
      >
        <MessageInput />
      </db.CreateForm>
    </div>
  );
}

function MessageInput() {
  const form = db.useCreateForm('messages');
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.submit();
    }
  };

  return (
    <div className="message-input">
      <textarea
        {...form.register('content')}
        placeholder="Type your message..."
        onKeyPress={handleKeyPress}
        rows={3}
      />
      <button type="submit" disabled={form.loading}>
        Send
      </button>
    </div>
  );
}
```

## Type Safety

This library is built with TypeScript-first approach, providing full type safety:

```tsx
// All operations are fully typed
const form = useForm<UserForm, ApiResponse>();
const fields = useFields<UserForm>();

// Field registration is type-safe
fields.register('name'); // ✅ Valid
fields.register('invalidField'); // ❌ TypeScript error

// Form submission is type-safe
const handleSubmit = async (data: UserForm) => {
  // data is fully typed
  return { success: true };
};
```

## Best Practices

### 1. Schema Definition

Always define your schemas with Zod for runtime validation:

```tsx
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(150),
});
```

### 2. Error Handling

Implement comprehensive error handling:

```tsx
const form = useForm<UserForm, ApiResponse>();

if (form.error) {
  // Handle specific error types
  if (form.error.message.includes('validation')) {
    // Handle validation errors
  } else if (form.error.message.includes('network')) {
    // Handle network errors
  }
}
```

### 3. Performance Optimization

Use React.memo for expensive components:

```tsx
const UserList = React.memo(({ users }: { users: User[] }) => {
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
});
```

### 4. Code Organization

Organize your CRUD operations in separate modules:

```tsx
// crud/users.ts
export const userCrud: CRUD<User, UserWrite> = {
  find: async ({ id }) => { /* implementation */ },
  create: async ({ data }) => { /* implementation */ },
  update: async ({ id, data }) => { /* implementation */ },
  remove: async ({ id }) => { /* implementation */ },
  list: async ({ filters, pagination }) => { /* implementation */ },
};

// database.ts
import { userCrud } from './crud/users';

export const db = database(
  { users: { readable: UserSchema, writable: UserWriteSchema } },
  userCrud
);
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create your feature branch
2. **Write tests** for your changes
3. **Follow TypeScript best practices**
4. **Update documentation** for new features
5. **Submit a pull request**

### Development Setup

```bash
# Clone the repository
git clone https://github.com/asasvirtuais/react.git
cd react

# Install dependencies
npm install

# Run TypeScript compiler
npx tsc --noEmit

# Run tests (if available)
npm test
```

### Code Style

- Use TypeScript strict mode
- Follow ESLint recommendations
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

## License

ISC License - see LICENSE file for details.

## Support

For questions, bug reports, or feature requests, please:

1. Check the [GitHub Issues](https://github.com/asasvirtuais/react/issues)
2. Create a new issue with detailed information
3. Provide code examples when possible

---

**Built with ❤️ using React, TypeScript, and Zod**