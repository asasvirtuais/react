# @asasvirtuais/react

A collection of general-purpose React hooks and components for state management, asynchronous actions, and form handling. This package provides the foundational building blocks for the `@asasvirtuais/crud/react` integration.

## Installation

```bash
npm install @asasvirtuais/react
```

## Core Hooks

### `useAction`

Manages the state of any asynchronous operation, tracking loading, error, and result states.

```typescript
import { useAction } from '@asasvirtuais/react'

function UserProfile() {
  const { trigger, loading, error, result } = useAction(
    (userId: string) => fetch(`/api/users/${userId}`).then(res => res.json())
  )

  return (
    <div>
      <button onClick={() => trigger('123')} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch User'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {result && <p>Welcome, {result.name}</p>}
    </div>
  )
}
```

### `useIndex`

A powerful hook for managing collections of data both as an indexed object (for fast lookups) and as an array (for easy rendering).

```typescript
import { useIndex } from '@asasvirtuais/react'

function TodoList({ initialTodos }) {
  const { index, array, set, remove } = useIndex<Todo>(initialTodos)

  // Add or update a todo
  const upsertTodo = (todo: Todo) => set(todo)
  
  // Remove a todo by its object
  const deleteTodo = (todo: Todo) => remove(todo)

  // Access a specific todo by its ID
  const getTodoById = (id: string) => index[id]

  // Render the list
  return array.map(todo => <TodoItem key={todo.id} todo={todo} />)
}
```

### `useFields` & `useForm`

A pair of hooks for robust form state management.

-   `useFields`: Manages the data within your form fields.
-   `useForm`: Handles the submission process, including loading and error states.

They are designed to be used with their respective providers, `FieldsProvider` and `FormProvider`.

#### Traditional Usage with Separate Components

```typescript
import { useFields, FieldsProvider, useForm, FormProvider } from '@asasvirtuais/react'

function SignUpForm() {
  const handleSubmit = async (fields) => {
    // Add validation logic here
    if (!fields.email.includes('@')) {
      throw new Error('Invalid email address.')
    }
    // Call your API
    return api.auth.signup(fields)
  }

  return (
    <FieldsProvider defaults={{ name: '', email: '' }}>
      <FormProvider onSubmit={handleSubmit}>
        <FormContent />
      </FormProvider>
    </FieldsProvider>
  )
}

function FormContent() {
  const { fields, setField } = useFields<{ name: string; email: string }>()
  const { submit, loading, error } = useForm()

  return (
    <form onSubmit={submit}>
      <input 
        value={fields.name}
        onChange={e => setField('name', e.target.value)}
        placeholder="Name"
      />
      <input 
        value={fields.email}
        onChange={e => setField('email', e.target.value)}
        placeholder="Email"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
      {error && <p>{error.message}</p>}
    </form>
  )
}
```

#### Render Props Pattern (Function as Children)

Both `FieldsProvider` and `FormProvider` support render props for more concise, inline usage:

```typescript
import { FieldsProvider, FormProvider } from '@asasvirtuais/react'

function SignUpForm() {
  const handleSubmit = async (fields) => {
    if (!fields.email.includes('@')) {
      throw new Error('Invalid email address.')
    }
    return api.auth.signup(fields)
  }

  return (
    <FieldsProvider defaults={{ name: '', email: '' }}>
      {({ fields, setField, register }) => (
        <FormProvider onSubmit={handleSubmit}>
          {({ submit, loading, error }) => (
            <form onSubmit={submit}>
              <input 
                {...register('name')}
                placeholder="Name"
              />
              <input 
                {...register('email')}
                placeholder="Email"
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
              {error && <p>{error.message}</p>}
            </form>
          )}
        </FormProvider>
      )}
    </FieldsProvider>
  )
}
```

#### Advanced Example: Dynamic Form with Field Array

```typescript
import { FieldsProvider, FormProvider } from '@asasvirtuais/react'

type FormData = {
  title: string
  items: Array<{ name: string; quantity: number }>
}

function DynamicForm() {
  return (
    <FieldsProvider<FormData> defaults={{ title: '', items: [{ name: '', quantity: 1 }] }}>
      {({ fields, setField }) => (
        <FormProvider onSubmit={async (data) => console.log(data)}>
          {({ submit, loading }) => (
            <form onSubmit={submit}>
              <input 
                value={fields.title || ''}
                onChange={e => setField('title', e.target.value)}
                placeholder="Title"
              />
              
              {fields.items?.map((item, index) => (
                <div key={index}>
                  <input 
                    value={item.name}
                    onChange={e => {
                      const newItems = [...fields.items]
                      newItems[index].name = e.target.value
                      setField('items', newItems)
                    }}
                    placeholder="Item name"
                  />
                  <input 
                    type="number"
                    value={item.quantity}
                    onChange={e => {
                      const newItems = [...fields.items]
                      newItems[index].quantity = parseInt(e.target.value)
                      setField('items', newItems)
                    }}
                  />
                </div>
              ))}
              
              <button 
                type="button"
                onClick={() => setField('items', [...fields.items, { name: '', quantity: 1 }])}
              >
                Add Item
              </button>
              
              <button type="submit" disabled={loading}>Submit</button>
            </form>
          )}
        </FormProvider>
      )}
    </FieldsProvider>
  )
}
```

## Integration with `@asasvirtuais/crud`

While this package provides generic hooks, it's the foundation for the data-binding magic in `@asasvirtuais/crud/react`. The `database` factory in that package uses these hooks internally to create a fully-featured data layer.

-   `useAction` is used to wrap each CRUD method (`find`, `create`, etc.).
-   `useIndex` is used to manage the client-side cache for each table.
-   `useFields` and `useForm` are used to power the `CreateForm`, `UpdateForm`, and `FilterForm` components.

This separation allows you to use these general-purpose hooks for any part of your application, not just for CRUD operations.

## License

MIT