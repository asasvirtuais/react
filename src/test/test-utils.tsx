import React from 'react'
import { render } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Custom render function for components
export const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, options)
}

// Custom render hook function
export const customRenderHook = renderHook

// User event utilities
export const user = userEvent.setup()

// Mock CRUD operations for testing
export const mockCRUD = {
  find: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  list: vi.fn(),
}

// Mock database schema for testing
export const mockDatabase = {
  users: {
    readable: {
      id: 'string',
      name: 'string',
      email: 'string',
    },
    writable: {
      name: 'string',
      email: 'string',
    },
  },
}

// Test data factories
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
})

export const createMockUsers = (count: number = 3) => 
  Array.from({ length: count }, (_, i) => createMockUser({ 
    id: String(i + 1),
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
  }))

// Re-export everything
export * from '@testing-library/react'
export { userEvent }