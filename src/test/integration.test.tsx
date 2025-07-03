import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { z } from 'zod'
import { database } from '../crud'
import { FieldsProvider, useFields } from '../fields'
import { FormProvider, useForm } from '../forms'
import { StoreProvider, useStore } from '../store'
import userEvent from '@testing-library/user-event'

describe('Integration Tests', () => {
  let mockCRUD: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockCRUD = {
      find: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
    }
  })

  it('should integrate Fields and Forms for complete form workflow', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue('Form submitted successfully')

    interface FormData {
      name: string
      email: string
    }

    const TestForm = () => {
      const { register } = useFields<FormData>()
      const { submit, loading, result } = useForm<FormData, string>()

      return (
        <form onSubmit={submit}>
          <input {...register('name')} data-testid="name-input" placeholder="Name" />
          <input {...register('email')} data-testid="email-input" placeholder="Email" />
          <button type="submit" disabled={loading} data-testid="submit-button">
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          {result && <div data-testid="result">{result}</div>}
        </form>
      )
    }

    render(
      <FieldsProvider<FormData> defaults={{ name: '', email: '' }}>
        <FormProvider<FormData, string> onSubmit={onSubmit}>
          <TestForm />
        </FormProvider>
      </FieldsProvider>
    )

    // Fill out the form
    await user.type(screen.getByTestId('name-input'), 'John Doe')
    await user.type(screen.getByTestId('email-input'), 'john@example.com')

    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      })
      expect(screen.getByTestId('result')).toHaveTextContent('Form submitted successfully')
    })
  })

  it('should integrate Database with Forms for CRUD operations', async () => {
    const user = userEvent.setup()
    
    const testDatabase = {
      users: {
        readable: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        writable: z.object({
          name: z.string(),
          email: z.string(),
        }),
      },
    }

    const db = database(testDatabase, mockCRUD)
    const newUser = { id: '1', name: 'John Doe', email: 'john@example.com' }
    mockCRUD.create.mockResolvedValue(newUser)

    const TestApp = () => {
      const users = db.useTable('users')
      const { register } = db.useCreateForm('users')
      const { submit, loading } = db.useCreateForm('users')

      return (
        <div>
          <div data-testid="users-count">{users.array.length}</div>
          <db.CreateForm table="users">
            <form onSubmit={submit}>
              <input {...register('name')} data-testid="name-input" />
              <input {...register('email')} data-testid="email-input" />
              <button type="submit" disabled={loading} data-testid="create-button">
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </db.CreateForm>
          <div data-testid="users-list">
            {users.array.map(user => (
              <div key={user.id} data-testid={`user-${user.id}`}>
                {user.name} - {user.email}
              </div>
            ))}
          </div>
        </div>
      )
    }

    const TestProvider = ({ children }: { children: React.ReactNode }) => {
      const usersTable = db.useTableProvider({ table: 'users' })
      
      return (
        <db.DatabaseProvider users={usersTable}>
          {children}
        </db.DatabaseProvider>
      )
    }

    render(
      <TestProvider>
        <TestApp />
      </TestProvider>
    )

    expect(screen.getByTestId('users-count')).toHaveTextContent('0')

    // Fill out the form
    await user.type(screen.getByTestId('name-input'), 'John Doe')
    await user.type(screen.getByTestId('email-input'), 'john@example.com')

    // Submit the form
    fireEvent.click(screen.getByTestId('create-button'))

    await waitFor(() => {
      expect(mockCRUD.create).toHaveBeenCalledWith({
        data: { name: 'John Doe', email: 'john@example.com' },
        table: 'users'
      })
      expect(screen.getByTestId('users-count')).toHaveTextContent('1')
      expect(screen.getByTestId('user-1')).toHaveTextContent('John Doe - john@example.com')
    })
  })

  it('should handle complete CRUD workflow', async () => {
    const user = userEvent.setup()
    
    const testDatabase = {
      users: {
        readable: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        writable: z.object({
          name: z.string(),
          email: z.string(),
        }),
      },
    }

    const db = database(testDatabase, mockCRUD)
    
    // Mock all CRUD operations
    const createdUser = { id: '1', name: 'John Doe', email: 'john@example.com' }
    const updatedUser = { id: '1', name: 'Johnny Doe', email: 'johnny@example.com' }
    const usersList = [createdUser, { id: '2', name: 'Jane Smith', email: 'jane@example.com' }]
    
    mockCRUD.create.mockResolvedValue(createdUser)
    mockCRUD.update.mockResolvedValue(updatedUser)
    mockCRUD.list.mockResolvedValue(usersList)
    mockCRUD.remove.mockResolvedValue(createdUser)

    const TestApp = () => {
      const users = db.useTable('users')

      const handleCreate = async () => {
        await users.create.trigger({
          data: { name: 'John Doe', email: 'john@example.com' }
        })
      }

      const handleUpdate = async () => {
        await users.update.trigger({
          id: '1',
          data: { name: 'Johnny Doe', email: 'johnny@example.com' }
        })
      }

      const handleList = async () => {
        await users.list.trigger({})
      }

      const handleRemove = async () => {
        await users.remove.trigger({ id: '1' })
      }

      return (
        <div>
          <div data-testid="users-count">{users.array.length}</div>
          <button onClick={handleCreate} data-testid="create-button">Create User</button>
          <button onClick={handleUpdate} data-testid="update-button">Update User</button>
          <button onClick={handleList} data-testid="list-button">List Users</button>
          <button onClick={handleRemove} data-testid="remove-button">Remove User</button>
          <div data-testid="users-list">
            {users.array.map(user => (
              <div key={user.id} data-testid={`user-${user.id}`}>
                {user.name} - {user.email}
              </div>
            ))}
          </div>
        </div>
      )
    }

    const TestProvider = ({ children }: { children: React.ReactNode }) => {
      const usersTable = db.useTableProvider({ table: 'users' })
      
      return (
        <db.DatabaseProvider users={usersTable}>
          {children}
        </db.DatabaseProvider>
      )
    }

    render(
      <TestProvider>
        <TestApp />
      </TestProvider>
    )

    expect(screen.getByTestId('users-count')).toHaveTextContent('0')

    // Test Create
    fireEvent.click(screen.getByTestId('create-button'))
    await waitFor(() => {
      expect(mockCRUD.create).toHaveBeenCalled()
      expect(screen.getByTestId('users-count')).toHaveTextContent('1')
      expect(screen.getByTestId('user-1')).toHaveTextContent('John Doe - john@example.com')
    })

    // Test Update
    fireEvent.click(screen.getByTestId('update-button'))
    await waitFor(() => {
      expect(mockCRUD.update).toHaveBeenCalled()
      expect(screen.getByTestId('user-1')).toHaveTextContent('Johnny Doe - johnny@example.com')
    })

    // Test List
    fireEvent.click(screen.getByTestId('list-button'))
    await waitFor(() => {
      expect(mockCRUD.list).toHaveBeenCalled()
      expect(screen.getByTestId('users-count')).toHaveTextContent('2')
      expect(screen.getByTestId('user-2')).toHaveTextContent('Jane Smith - jane@example.com')
    })

    // Test Remove
    fireEvent.click(screen.getByTestId('remove-button'))
    await waitFor(() => {
      expect(mockCRUD.remove).toHaveBeenCalled()
      expect(screen.getByTestId('users-count')).toHaveTextContent('1')
      expect(screen.queryByTestId('user-1')).not.toBeInTheDocument()
    })
  })

  it('should handle Store integration with complex data', () => {
    interface User {
      id: string
      name: string
      email: string
    }

    interface Post {
      id: string
      title: string
      content: string
      authorId: string
    }

    const initialData = {
      users: [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' }
      ] as User[],
      posts: [
        { id: '1', title: 'Post 1', content: 'Content 1', authorId: '1' },
        { id: '2', title: 'Post 2', content: 'Content 2', authorId: '2' }
      ] as Post[]
    }

    const TestApp = () => {
      const store = useStore()
      
      const addUser = () => {
        store.users.set({ id: '3', name: 'Bob', email: 'bob@example.com' })
      }

      const addPost = () => {
        store.posts.set({ id: '3', title: 'Post 3', content: 'Content 3', authorId: '3' })
      }

      const getUserPosts = (userId: string) => {
        return store.posts.array.filter(post => post.authorId === userId)
      }

      return (
        <div>
          <div data-testid="users-count">{store.users.array.length}</div>
          <div data-testid="posts-count">{store.posts.array.length}</div>
          <button onClick={addUser} data-testid="add-user">Add User</button>
          <button onClick={addPost} data-testid="add-post">Add Post</button>
          <div data-testid="john-posts">{getUserPosts('1').length}</div>
          <div data-testid="jane-posts">{getUserPosts('2').length}</div>
        </div>
      )
    }

    render(
      <StoreProvider {...initialData}>
        <TestApp />
      </StoreProvider>
    )

    expect(screen.getByTestId('users-count')).toHaveTextContent('2')
    expect(screen.getByTestId('posts-count')).toHaveTextContent('2')
    expect(screen.getByTestId('john-posts')).toHaveTextContent('1')
    expect(screen.getByTestId('jane-posts')).toHaveTextContent('1')

    fireEvent.click(screen.getByTestId('add-user'))
    fireEvent.click(screen.getByTestId('add-post'))

    expect(screen.getByTestId('users-count')).toHaveTextContent('3')
    expect(screen.getByTestId('posts-count')).toHaveTextContent('3')
  })
})