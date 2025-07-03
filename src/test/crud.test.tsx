import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { z } from 'zod'
import { database } from '../crud'
import { mockCRUD } from './test-utils'
import userEvent from '@testing-library/user-event'

// Mock database schema
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
  posts: {
    readable: z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      authorId: z.string(),
    }),
    writable: z.object({
      title: z.string(),
      content: z.string(),
      authorId: z.string(),
    }),
  },
}

describe('database function', () => {
  let db: ReturnType<typeof database>
  let mockCRUDMethods: typeof mockCRUD

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockCRUDMethods = {
      find: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
    }

    db = database(testDatabase, mockCRUDMethods)
  })

  describe('DatabaseProvider and useDatabase', () => {
    it('should provide database context with tables', () => {
      const mockUsers = [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' }
      ]

      const TestComponent = () => {
        const database = db.useDatabase()
        return (
          <div>
            <div data-testid="users-count">{database.users.array.length}</div>
            <div data-testid="posts-count">{database.posts.array.length}</div>
          </div>
        )
      }

      const TestProvider = ({ children }: { children: React.ReactNode }) => {
        const usersTable = db.useTableProvider({ table: 'users', asAbove: Object.fromEntries(mockUsers.map(u => [u.id, u])) })
        const postsTable = db.useTableProvider({ table: 'posts' })
        
        return (
          <db.DatabaseProvider users={usersTable} posts={postsTable}>
            {children}
          </db.DatabaseProvider>
        )
      }

      render(
        <TestProvider>
          <TestComponent />
        </TestProvider>
      )

      expect(screen.getByTestId('users-count')).toHaveTextContent('2')
      expect(screen.getByTestId('posts-count')).toHaveTextContent('0')
    })
  })

  describe('useTable', () => {
    it('should provide table-specific methods and data', () => {
      const TestComponent = () => {
        const users = db.useTable('users')
        return (
          <div>
            <div data-testid="users-count">{users.array.length}</div>
            <div data-testid="has-create">{users.create ? 'true' : 'false'}</div>
            <div data-testid="has-update">{users.update ? 'true' : 'false'}</div>
            <div data-testid="has-remove">{users.remove ? 'true' : 'false'}</div>
            <div data-testid="has-list">{users.list ? 'true' : 'false'}</div>
            <div data-testid="has-find">{users.find ? 'true' : 'false'}</div>
          </div>
        )
      }

      const TestProvider = ({ children }: { children: React.ReactNode }) => {
        const usersTable = db.useTableProvider({ table: 'users' })
        const postsTable = db.useTableProvider({ table: 'posts' })
        
        return (
          <db.DatabaseProvider users={usersTable} posts={postsTable}>
            {children}
          </db.DatabaseProvider>
        )
      }

      render(
        <TestProvider>
          <TestComponent />
        </TestProvider>
      )

      expect(screen.getByTestId('users-count')).toHaveTextContent('0')
      expect(screen.getByTestId('has-create')).toHaveTextContent('true')
      expect(screen.getByTestId('has-update')).toHaveTextContent('true')
      expect(screen.getByTestId('has-remove')).toHaveTextContent('true')
      expect(screen.getByTestId('has-list')).toHaveTextContent('true')
      expect(screen.getByTestId('has-find')).toHaveTextContent('true')
    })
  })

  describe('CRUD operations', () => {
    it('should handle create operation and update index', async () => {
      const newUser = { id: '3', name: 'Bob', email: 'bob@example.com' }
      mockCRUDMethods.create.mockResolvedValue(newUser)

      const TestComponent = () => {
        const users = db.useTable('users')
        
        const handleCreate = async () => {
          await users.create.trigger({ data: { name: 'Bob', email: 'bob@example.com' } })
        }

        return (
          <div>
            <div data-testid="users-count">{users.array.length}</div>
            <div data-testid="create-loading">{users.create.loading ? 'true' : 'false'}</div>
            <button onClick={handleCreate} data-testid="create-button">Create User</button>
          </div>
        )
      }

      const TestProvider = ({ children }: { children: React.ReactNode }) => {
        const usersTable = db.useTableProvider({ table: 'users' })
        const postsTable = db.useTableProvider({ table: 'posts' })
        
        return (
          <db.DatabaseProvider users={usersTable} posts={postsTable}>
            {children}
          </db.DatabaseProvider>
        )
      }

      render(
        <TestProvider>
          <TestComponent />
        </TestProvider>
      )

      expect(screen.getByTestId('users-count')).toHaveTextContent('0')
      expect(screen.getByTestId('create-loading')).toHaveTextContent('false')

      fireEvent.click(screen.getByTestId('create-button'))

      await waitFor(() => {
        expect(mockCRUDMethods.create).toHaveBeenCalledWith({
          data: { name: 'Bob', email: 'bob@example.com' },
          table: 'users'
        })
        expect(screen.getByTestId('users-count')).toHaveTextContent('1')
        expect(screen.getByTestId('create-loading')).toHaveTextContent('false')
      })
    })

    it('should handle update operation and update index', async () => {
      const existingUser = { id: '1', name: 'John', email: 'john@example.com' }
      const updatedUser = { id: '1', name: 'Johnny', email: 'johnny@example.com' }
      mockCRUDMethods.update.mockResolvedValue(updatedUser)

      const TestComponent = () => {
        const users = db.useTable('users')
        
        const handleUpdate = async () => {
          await users.update.trigger({ 
            id: '1', 
            data: { name: 'Johnny', email: 'johnny@example.com' } 
          })
        }

        return (
          <div>
            <div data-testid="user-name">{users.array[0]?.name || 'No user'}</div>
            <button onClick={handleUpdate} data-testid="update-button">Update User</button>
          </div>
        )
      }

      const TestProvider = ({ children }: { children: React.ReactNode }) => {
        const usersTable = db.useTableProvider({ 
          table: 'users', 
          asAbove: { '1': existingUser } 
        })
        const postsTable = db.useTableProvider({ table: 'posts' })
        
        return (
          <db.DatabaseProvider users={usersTable} posts={postsTable}>
            {children}
          </db.DatabaseProvider>
        )
      }

      render(
        <TestProvider>
          <TestComponent />
        </TestProvider>
      )

      expect(screen.getByTestId('user-name')).toHaveTextContent('John')

      fireEvent.click(screen.getByTestId('update-button'))

      await waitFor(() => {
        expect(mockCRUDMethods.update).toHaveBeenCalledWith({
          id: '1',
          data: { name: 'Johnny', email: 'johnny@example.com' },
          table: 'users'
        })
        expect(screen.getByTestId('user-name')).toHaveTextContent('Johnny')
      })
    })

    it('should handle remove operation and update index', async () => {
      const existingUser = { id: '1', name: 'John', email: 'john@example.com' }
      mockCRUDMethods.remove.mockResolvedValue(existingUser)

      const TestComponent = () => {
        const users = db.useTable('users')
        
        const handleRemove = async () => {
          await users.remove.trigger({ id: '1' })
        }

        return (
          <div>
            <div data-testid="users-count">{users.array.length}</div>
            <button onClick={handleRemove} data-testid="remove-button">Remove User</button>
          </div>
        )
      }

      const TestProvider = ({ children }: { children: React.ReactNode }) => {
        const usersTable = db.useTableProvider({ 
          table: 'users', 
          asAbove: { '1': existingUser } 
        })
        const postsTable = db.useTableProvider({ table: 'posts' })
        
        return (
          <db.DatabaseProvider users={usersTable} posts={postsTable}>
            {children}
          </db.DatabaseProvider>
        )
      }

      render(
        <TestProvider>
          <TestComponent />
        </TestProvider>
      )

      expect(screen.getByTestId('users-count')).toHaveTextContent('1')

      fireEvent.click(screen.getByTestId('remove-button'))

      await waitFor(() => {
        expect(mockCRUDMethods.remove).toHaveBeenCalledWith({
          id: '1',
          table: 'users'
        })
        expect(screen.getByTestId('users-count')).toHaveTextContent('0')
      })
    })

    it('should handle list operation and update index', async () => {
      const users = [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' }
      ]
      mockCRUDMethods.list.mockResolvedValue(users)

      const TestComponent = () => {
        const usersTable = db.useTable('users')
        
        const handleList = async () => {
          await usersTable.list.trigger({})
        }

        return (
          <div>
            <div data-testid="users-count">{usersTable.array.length}</div>
            <button onClick={handleList} data-testid="list-button">List Users</button>
          </div>
        )
      }

      const TestProvider = ({ children }: { children: React.ReactNode }) => {
        const usersTable = db.useTableProvider({ table: 'users' })
        const postsTable = db.useTableProvider({ table: 'posts' })
        
        return (
          <db.DatabaseProvider users={usersTable} posts={postsTable}>
            {children}
          </db.DatabaseProvider>
        )
      }

      render(
        <TestProvider>
          <TestComponent />
        </TestProvider>
      )

      expect(screen.getByTestId('users-count')).toHaveTextContent('0')

      fireEvent.click(screen.getByTestId('list-button'))

      await waitFor(() => {
        expect(mockCRUDMethods.list).toHaveBeenCalledWith({
          table: 'users'
        })
        expect(screen.getByTestId('users-count')).toHaveTextContent('2')
      })
    })
  })

  describe('CreateForm', () => {
    it('should render create form and handle submission', async () => {
      const user = userEvent.setup()
      const newUser = { id: '3', name: 'Bob', email: 'bob@example.com' }
      mockCRUDMethods.create.mockResolvedValue(newUser)

      const onSuccess = vi.fn()

      const TestComponent = () => {
        const { register } = db.useCreateForm('users')
        const { submit } = db.useCreateForm('users')
        
        return (
          <form onSubmit={submit}>
            <input {...register('name')} data-testid="name-input" />
            <input {...register('email')} data-testid="email-input" />
            <button type="submit" data-testid="submit-button">Create</button>
          </form>
        )
      }

      const TestProvider = ({ children }: { children: React.ReactNode }) => {
        const usersTable = db.useTableProvider({ table: 'users' })
        const postsTable = db.useTableProvider({ table: 'posts' })
        
        return (
          <db.DatabaseProvider users={usersTable} posts={postsTable}>
            <db.CreateForm table="users" onSuccess={onSuccess}>
              {children}
            </db.CreateForm>
          </db.DatabaseProvider>
        )
      }

      render(
        <TestProvider>
          <TestComponent />
        </TestProvider>
      )

      await user.type(screen.getByTestId('name-input'), 'Bob')
      await user.type(screen.getByTestId('email-input'), 'bob@example.com')
      
      fireEvent.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(mockCRUDMethods.create).toHaveBeenCalledWith({
          data: { name: 'Bob', email: 'bob@example.com' },
          table: 'users'
        })
        expect(onSuccess).toHaveBeenCalledWith(newUser)
      })
    })
  })

  describe('UpdateForm', () => {
    it('should render update form with defaults and handle submission', async () => {
      const user = userEvent.setup()
      const updatedUser = { id: '1', name: 'Johnny', email: 'johnny@example.com' }
      mockCRUDMethods.update.mockResolvedValue(updatedUser)

      const onSuccess = vi.fn()

      const TestComponent = () => {
        const { register } = db.useUpdateForm('users')
        const { submit } = db.useUpdateForm('users')
        
        return (
          <form onSubmit={submit}>
            <input {...register('name')} data-testid="name-input" />
            <input {...register('email')} data-testid="email-input" />
            <button type="submit" data-testid="submit-button">Update</button>
          </form>
        )
      }

      const TestProvider = ({ children }: { children: React.ReactNode }) => {
        const usersTable = db.useTableProvider({ table: 'users' })
        const postsTable = db.useTableProvider({ table: 'posts' })
        
        return (
          <db.DatabaseProvider users={usersTable} posts={postsTable}>
            <db.UpdateForm 
              table="users" 
              id="1" 
              defaults={{ name: 'John', email: 'john@example.com' }}
              onSuccess={onSuccess}
            >
              {children}
            </db.UpdateForm>
          </db.DatabaseProvider>
        )
      }

      render(
        <TestProvider>
          <TestComponent />
        </TestProvider>
      )

      expect(screen.getByTestId('name-input')).toHaveValue('John')
      expect(screen.getByTestId('email-input')).toHaveValue('john@example.com')

      await user.clear(screen.getByTestId('name-input'))
      await user.type(screen.getByTestId('name-input'), 'Johnny')
      
      fireEvent.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(mockCRUDMethods.update).toHaveBeenCalledWith({
          id: '1',
          data: { name: 'Johnny', email: 'john@example.com' },
          table: 'users'
        })
        expect(onSuccess).toHaveBeenCalledWith(updatedUser)
      })
    })
  })

  describe('Error handling', () => {
    it('should handle CRUD operation errors', async () => {
      const error = new Error('Network error')
      mockCRUDMethods.create.mockRejectedValue(error)

      const TestComponent = () => {
        const users = db.useTable('users')
        
        const handleCreate = async () => {
          try {
            await users.create.trigger({ data: { name: 'Bob', email: 'bob@example.com' } })
          } catch (err) {
            // Handle error
          }
        }

        return (
          <div>
            <div data-testid="create-error">{users.create.error?.message || 'no error'}</div>
            <button onClick={handleCreate} data-testid="create-button">Create User</button>
          </div>
        )
      }

      const TestProvider = ({ children }: { children: React.ReactNode }) => {
        const usersTable = db.useTableProvider({ table: 'users' })
        const postsTable = db.useTableProvider({ table: 'posts' })
        
        return (
          <db.DatabaseProvider users={usersTable} posts={postsTable}>
            {children}
          </db.DatabaseProvider>
        )
      }

      render(
        <TestProvider>
          <TestComponent />
        </TestProvider>
      )

      fireEvent.click(screen.getByTestId('create-button'))

      await waitFor(() => {
        expect(screen.getByTestId('create-error')).toHaveTextContent('Network error')
      })
    })
  })
})