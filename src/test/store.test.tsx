import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StoreProvider, useStore } from '../store'

describe('StoreProvider and useStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide store with multiple tables', () => {
    interface User {
      id: string
      name: string
    }

    interface Product {
      id: string
      title: string
      price: number
    }

    const initialData = {
      users: [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' }
      ] as User[],
      products: [
        { id: '1', title: 'Product 1', price: 10 },
        { id: '2', title: 'Product 2', price: 20 }
      ] as Product[]
    }

    const TestComponent = () => {
      const store = useStore()
      return (
        <div>
          <div data-testid="users-count">{store.users.array.length}</div>
          <div data-testid="products-count">{store.products.array.length}</div>
          <div data-testid="first-user-name">{store.users.array[0]?.name}</div>
          <div data-testid="first-product-title">{store.products.array[0]?.title}</div>
        </div>
      )
    }

    render(
      <StoreProvider {...initialData}>
        <TestComponent />
      </StoreProvider>
    )

    expect(screen.getByTestId('users-count')).toHaveTextContent('2')
    expect(screen.getByTestId('products-count')).toHaveTextContent('2')
    expect(screen.getByTestId('first-user-name')).toHaveTextContent('John')
    expect(screen.getByTestId('first-product-title')).toHaveTextContent('Product 1')
  })

  it('should handle adding items to store tables', () => {
    interface User {
      id: string
      name: string
    }

    const initialData = {
      users: [
        { id: '1', name: 'John' }
      ] as User[]
    }

    const TestComponent = () => {
      const store = useStore()
      
      const addUser = () => {
        store.users.set({ id: '2', name: 'Jane' })
      }

      return (
        <div>
          <div data-testid="users-count">{store.users.array.length}</div>
          <button onClick={addUser} data-testid="add-user">Add User</button>
          <div data-testid="users-list">
            {store.users.array.map(user => (
              <div key={user.id} data-testid={`user-${user.id}`}>
                {user.name}
              </div>
            ))}
          </div>
        </div>
      )
    }

    render(
      <StoreProvider {...initialData}>
        <TestComponent />
      </StoreProvider>
    )

    expect(screen.getByTestId('users-count')).toHaveTextContent('1')
    expect(screen.queryByTestId('user-2')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('add-user'))

    expect(screen.getByTestId('users-count')).toHaveTextContent('2')
    expect(screen.getByTestId('user-2')).toHaveTextContent('Jane')
  })

  it('should handle updating items in store tables', () => {
    interface User {
      id: string
      name: string
    }

    const initialData = {
      users: [
        { id: '1', name: 'John' }
      ] as User[]
    }

    const TestComponent = () => {
      const store = useStore()
      
      const updateUser = () => {
        store.users.set({ id: '1', name: 'Johnny' })
      }

      return (
        <div>
          <div data-testid="user-name">{store.users.array[0]?.name}</div>
          <button onClick={updateUser} data-testid="update-user">Update User</button>
        </div>
      )
    }

    render(
      <StoreProvider {...initialData}>
        <TestComponent />
      </StoreProvider>
    )

    expect(screen.getByTestId('user-name')).toHaveTextContent('John')

    fireEvent.click(screen.getByTestId('update-user'))

    expect(screen.getByTestId('user-name')).toHaveTextContent('Johnny')
  })

  it('should handle removing items from store tables', () => {
    interface User {
      id: string
      name: string
    }

    const initialData = {
      users: [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' }
      ] as User[]
    }

    const TestComponent = () => {
      const store = useStore()
      
      const removeUser = () => {
        store.users.remove({ id: '1', name: 'John' })
      }

      return (
        <div>
          <div data-testid="users-count">{store.users.array.length}</div>
          <button onClick={removeUser} data-testid="remove-user">Remove User</button>
          <div data-testid="remaining-user">{store.users.array[0]?.name}</div>
        </div>
      )
    }

    render(
      <StoreProvider {...initialData}>
        <TestComponent />
      </StoreProvider>
    )

    expect(screen.getByTestId('users-count')).toHaveTextContent('2')
    expect(screen.getByTestId('remaining-user')).toHaveTextContent('John')

    fireEvent.click(screen.getByTestId('remove-user'))

    expect(screen.getByTestId('users-count')).toHaveTextContent('1')
    expect(screen.getByTestId('remaining-user')).toHaveTextContent('Jane')
  })

  it('should handle direct index manipulation', () => {
    interface User {
      id: string
      name: string
    }

    const initialData = {
      users: [] as User[]
    }

    const TestComponent = () => {
      const store = useStore()
      
      const setUsers = () => {
        store.users.setIndex({
          '1': { id: '1', name: 'Direct User 1' },
          '2': { id: '2', name: 'Direct User 2' }
        })
      }

      return (
        <div>
          <div data-testid="users-count">{store.users.array.length}</div>
          <button onClick={setUsers} data-testid="set-users">Set Users</button>
        </div>
      )
    }

    render(
      <StoreProvider {...initialData}>
        <TestComponent />
      </StoreProvider>
    )

    expect(screen.getByTestId('users-count')).toHaveTextContent('0')

    fireEvent.click(screen.getByTestId('set-users'))

    expect(screen.getByTestId('users-count')).toHaveTextContent('2')
  })

  it('should handle empty initial data', () => {
    const TestComponent = () => {
      const store = useStore()
      return (
        <div>
          <div data-testid="empty-users">{store.users?.array.length || 0}</div>
          <div data-testid="empty-products">{store.products?.array.length || 0}</div>
        </div>
      )
    }

    render(
      <StoreProvider users={[]} products={[]}>
        <TestComponent />
      </StoreProvider>
    )

    expect(screen.getByTestId('empty-users')).toHaveTextContent('0')
    expect(screen.getByTestId('empty-products')).toHaveTextContent('0')
  })
})