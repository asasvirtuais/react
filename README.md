# @asasvirtuais/react

A powerful, type-safe React library for building CRUD applications with TypeScript and Zod validation. This library provides a comprehensive set of tools for managing database operations, form handling, and state management in React applications.

## Features

- 🔒 **Type-safe** - Full TypeScript support with Zod schema validation
- 🚀 **CRUD Operations** - Complete Create, Read, Update, Delete operations
- 📝 **Form Management** - Built-in form handling with field registration
- 🎯 **State Management** - Efficient data indexing and caching
- ⚛️ **React Context** - Seamless integration with React's context system
- 🔄 **Loading States** - Built-in loading and error state management
- 🛠️ **Flexible** - Modular architecture for easy customization

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

### 1. Define Your Database Schema

```typescript
import { z } from 'zod';
import { database } from '@asasvirtuais/react';

// Define your database schema
const userSchema = {
  readable: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    createdAt: z.date(),
  }),
  writable: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
};

const postSchema = {
  readable: z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    userId: z.string(),
    createdAt: z.date(),
  }),
  writable: z.object({
    title: z.string(),
    content: z.string(),
    userId: z.string(),
  }),
};

// Create database configuration
const databaseConfig = {
  users: userSchema,
  posts: postSchema,
};
```

### 2. Implement CRUD Operations

```typescript
import { CRUD } from '@asasvirtuais/crud';

// Implement your CRUD operations
const crudOperations: CRUD<any, any> = {
  async find({ table, id }) {
    // Your find implementation
    const response = await fetch(`/api/${table}/${id}`);
    return response.json();
  },
  
  async create({ table, data }) {
    // Your create implementation
    const response = await fetch(`/api/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  async update({ table, id, data }) {
    // Your update implementation
    const response = await fetch(`/api/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  async remove({ table, id }) {
    // Your remove implementation
    const response = await fetch(`/api/${table}/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
  
  async list({ table, filters, sort, limit, offset }) {
    // Your list implementation
    const params = new URLSearchParams({
      ...(filters && { filters: JSON.stringify(filters) }),
      ...(sort && { sort: JSON.stringify(sort) }),
      ...(limit && { limit: limit.toString() }),
      ...(offset && { offset: offset.toString() }),
    });
    const response = await fetch(`/api/${table}?${params}`);
    return response.json();
  },
};
```

### 3. Create Your Database Instance

```typescript
// Create your database instance
const db = database(databaseConfig, crudOperations);
```

### 4. Set Up Providers

```typescript
import React from 'react';

function App() {
  return (
    <db.DatabaseProvider
      users={db.useTableProvider({ table: 'users' })}
      posts={db.useTableProvider({ table: 'posts' })}
    >
      <UserManagement />
      <PostManagement />
    </db.DatabaseProvider>
  );
}
```

## API Reference

### Database Configuration

#### `database(schema, operations)`

Creates a database instance with type-safe operations.

**Parameters:**
- `schema` - Object containing table definitions with `readable` and `writable` Zod schemas
- `operations` - CRUD operations implementation

**Returns:** Database instance with providers and hooks

### Core Hooks

#### `useTable(tableName)`

Access table operations and state.

```typescript
const { index, array, find, create, update, remove, list } = useTable('users');
```

#### `useTableProvider(options)`

Configure table provider with initial data.

```typescript
const tableProvider = useTableProvider({
  table: 'users',
  asAbove: { '1': { id: '1', name: 'John', email: 'john@example.com' } }
});
```

### Form Components

#### `CreateForm`

Component for creating new records.

```typescript
<db.CreateForm
  table="users"
  defaults={{ name: '', email: '' }}
  onSuccess={(user) => console.log('Created:', user)}
>
  <UserForm />
</db.CreateForm>
```

#### `UpdateForm`

Component for updating existing records.

```typescript
<db.UpdateForm
  table="users"
  id="user123"
  defaults={{ name: 'Updated Name' }}
  onSuccess={(user) => console.log('Updated:', user)}
>
  <UserForm />
</db.UpdateForm>
```

#### `FilterForm`

Component for filtering and searching records.

```typescript
<db.FilterForm
  table="users"
  defaults={{ limit: 10, offset: 0 }}
  onSuccess={(users) => console.log('Found:', users)}
>
  <SearchForm />
</db.FilterForm>
```

### Form Hooks

#### `useCreateForm(tableName)`

Hook for create form functionality.

```typescript
const { fields, setField, register, submit, loading, error } = useCreateForm('users');
```

#### `useUpdateForm(tableName)`

Hook for update form functionality.

```typescript
const { fields, setField, register, submit, loading, error } = useUpdateForm('users');
```

#### `useFiltersForm(tableName)`

Hook for filter form functionality.

```typescript
const { fields, setField, register, submit, loading, error } = useFiltersForm('users');
```

### Field Management

#### `FieldsProvider`

Provider for managing form fields.

```typescript
<FieldsProvider defaults={{ name: '', email: '' }}>
  <MyForm />
</FieldsProvider>
```

#### `useFields()`

Hook for accessing field state and methods.

```typescript
const { fields, setFields, register, setField } = useFields();
```

### Form Submission

#### `FormProvider`

Provider for handling form submission.

```typescript
<FormProvider onSubmit={handleSubmit}>
  <MyForm />
</FormProvider>
```

#### `useForm()`

Hook for form submission functionality.

```typescript
const { submit, loading, error, result } = useForm();
```

## Complete Example

Here's a complete example of a user management system:

```typescript
import React from 'react';
import { z } from 'zod';
import { database } from '@asasvirtuais/react';
import { CRUD } from '@asasvirtuais/crud';

// 1. Define schema
const userSchema = {
  readable: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    createdAt: z.date(),
  }),
  writable: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
};

const databaseConfig = { users: userSchema };

// 2. Implement CRUD operations
const crudOperations: CRUD<any, any> = {
  async find({ table, id }) {
    const response = await fetch(`/api/${table}/${id}`);
    return response.json();
  },
  async create({ table, data }) {
    const response = await fetch(`/api/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  async update({ table, id, data }) {
    const response = await fetch(`/api/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  async remove({ table, id }) {
    const response = await fetch(`/api/${table}/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
  async list({ table, filters }) {
    const params = filters ? `?filters=${JSON.stringify(filters)}` : '';
    const response = await fetch(`/api/${table}${params}`);
    return response.json();
  },
};

// 3. Create database instance
const db = database(databaseConfig, crudOperations);

// 4. User form component
function UserForm() {
  const { register } = useFields();
  const { submit, loading, error } = useForm();

  return (
    <form onSubmit={submit}>
      <div>
        <label htmlFor="name">Name:</label>
        <input type="text" {...register('name')} />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input type="email" {...register('email')} />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </form>
  );
}

// 5. User list component
function UserList() {
  const { array, list } = useTable('users');
  
  React.useEffect(() => {
    list.trigger({});
  }, []);

  if (list.loading) return <p>Loading...</p>;
  if (list.error) return <p>Error: {list.error.message}</p>;

  return (
    <div>
      <h2>Users</h2>
      {array.map((user) => (
        <div key={user.id}>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
}

// 6. Create user component
function CreateUser() {
  return (
    <db.CreateForm
      table="users"
      defaults={{ name: '', email: '' }}
      onSuccess={(user) => alert(`Created user: ${user.name}`)}
    >
      <h2>Create User</h2>
      <UserForm />
    </db.CreateForm>
  );
}

// 7. Main application
function App() {
  return (
    <db.DatabaseProvider
      users={db.useTableProvider({ table: 'users' })}
    >
      <div>
        <CreateUser />
        <UserList />
      </div>
    </db.DatabaseProvider>
  );
}

export default App;
```

## Advanced Usage

### Custom Field Components

```typescript
import { useField } from '@asasvirtuais/react';

function CustomInput({ defaultValue, handle }) {
  const { value, onChange } = useField({ defaultValue, handle });
  
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      className="custom-input"
    />
  );
}
```

### Single Record Provider

```typescript
<db.SingleProvider id="user123" table="users">
  <UserDetails />
</db.SingleProvider>
```

### Using Single Record Hook

```typescript
function UserDetails() {
  const { single, loading } = db.useSingle();
  
  if (loading) return <p>Loading...</p>;
  if (!single) return <p>User not found</p>;
  
  return (
    <div>
      <h2>{single.name}</h2>
      <p>{single.email}</p>
    </div>
  );
}
```

### Action Hook

```typescript
import { useAction } from '@asasvirtuais/react';

function MyComponent() {
  const { trigger, loading, error, result } = useAction(
    async (data) => {
      const response = await fetch('/api/custom', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    {
      onSuccess: (result) => console.log('Success:', result),
      autoTrigger: false,
    }
  );

  return (
    <button onClick={() => trigger({ data: 'test' })}>
      {loading ? 'Loading...' : 'Execute Action'}
    </button>
  );
}
```

### Data Indexing

```typescript
import { useIndex } from '@asasvirtuais/react';

function MyComponent() {
  const { index, array, set, remove } = useIndex({
    '1': { id: '1', name: 'John' },
    '2': { id: '2', name: 'Jane' },
  });

  const addUser = () => {
    set({ id: '3', name: 'Bob' });
  };

  const removeUser = () => {
    remove({ id: '1', name: 'John' });
  };

  return (
    <div>
      {array.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={addUser}>Add User</button>
      <button onClick={removeUser}>Remove User</button>
    </div>
  );
}
```

## TypeScript Support

This library is built with TypeScript and provides full type safety:

```typescript
// Types are automatically inferred from your Zod schemas
type User = z.infer<typeof userSchema.readable>;
type CreateUserData = z.infer<typeof userSchema.writable>;

// All operations are type-safe
const { create } = useTable('users');
create.trigger({ 
  data: { 
    name: 'John', 
    email: 'john@example.com' 
  } 
}); // ✅ Type-safe

create.trigger({ 
  data: { 
    name: 'John', 
    invalidField: 'test' 
  } 
}); // ❌ TypeScript error
```

## Error Handling

The library provides comprehensive error handling:

```typescript
const { create } = useTable('users');

// Errors are automatically caught and stored
if (create.error) {
  console.error('Create failed:', create.error.message);
}

// You can also handle errors manually
try {
  const result = await create.trigger({ data: userData });
} catch (error) {
  console.error('Manual error handling:', error);
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License

## Support

For support, please open an issue on the GitHub repository.