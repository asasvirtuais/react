import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { FieldProvider, useField, FieldsProvider, useFields } from '../fields'
import userEvent from '@testing-library/user-event'

describe('FieldProvider and useField', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide field value and onChange handler', () => {
    const TestComponent = () => {
      const { value, onChange } = useField()
      return (
        <input 
          data-testid="input"
          value={value}
          onChange={onChange}
        />
      )
    }

    render(
      <FieldProvider defaultValue="test-value">
        <TestComponent />
      </FieldProvider>
    )

    const input = screen.getByTestId('input') as HTMLInputElement
    expect(input.value).toBe('test-value')
  })

  it('should handle input changes', async () => {
    const user = userEvent.setup()
    
    const TestComponent = () => {
      const { value, onChange } = useField()
      return (
        <input 
          data-testid="input"
          value={value}
          onChange={onChange}
        />
      )
    }

    render(
      <FieldProvider defaultValue="">
        <TestComponent />
      </FieldProvider>
    )

    const input = screen.getByTestId('input')
    await user.type(input, 'new value')
    
    expect(input).toHaveValue('new value')
  })

  it('should call handle function when value changes', async () => {
    const user = userEvent.setup()
    const handleMock = vi.fn()
    
    const TestComponent = () => {
      const { value, onChange } = useField()
      return (
        <input 
          data-testid="input"
          value={value}
          onChange={onChange}
        />
      )
    }

    render(
      <FieldProvider defaultValue="" handle={handleMock}>
        <TestComponent />
      </FieldProvider>
    )

    const input = screen.getByTestId('input')
    await user.type(input, 'test')
    
    expect(handleMock).toHaveBeenCalledWith('t')
    expect(handleMock).toHaveBeenCalledWith('e')
    expect(handleMock).toHaveBeenCalledWith('s')
    expect(handleMock).toHaveBeenCalledWith('t')
  })

  it('should update value when setValue is called', () => {
    const TestComponent = () => {
      const { value, setValue } = useField()
      return (
        <div>
          <div data-testid="value">{value}</div>
          <button 
            onClick={() => setValue('updated')}
            data-testid="update"
          >
            Update
          </button>
        </div>
      )
    }

    render(
      <FieldProvider defaultValue="initial">
        <TestComponent />
      </FieldProvider>
    )

    expect(screen.getByTestId('value')).toHaveTextContent('initial')
    
    fireEvent.click(screen.getByTestId('update'))
    
    expect(screen.getByTestId('value')).toHaveTextContent('updated')
  })
})

describe('FieldsProvider and useFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide fields and register function', () => {
    interface TestFields {
      name: string
      email: string
    }

    const TestComponent = () => {
      const { fields, register } = useFields<TestFields>()
      return (
        <div>
          <input {...register('name')} data-testid="name-input" />
          <input {...register('email')} data-testid="email-input" />
          <div data-testid="name-value">{fields.name}</div>
          <div data-testid="email-value">{fields.email}</div>
        </div>
      )
    }

    render(
      <FieldsProvider<TestFields> defaults={{ name: 'John', email: 'john@example.com' }}>
        <TestComponent />
      </FieldsProvider>
    )

    expect(screen.getByTestId('name-input')).toHaveValue('John')
    expect(screen.getByTestId('email-input')).toHaveValue('john@example.com')
    expect(screen.getByTestId('name-value')).toHaveTextContent('John')
    expect(screen.getByTestId('email-value')).toHaveTextContent('john@example.com')
  })

  it('should handle field changes through register', async () => {
    const user = userEvent.setup()
    
    interface TestFields {
      name: string
      email: string
    }

    const TestComponent = () => {
      const { fields, register } = useFields<TestFields>()
      return (
        <div>
          <input {...register('name')} data-testid="name-input" />
          <div data-testid="name-value">{fields.name}</div>
        </div>
      )
    }

    render(
      <FieldsProvider<TestFields> defaults={{ name: '', email: '' }}>
        <TestComponent />
      </FieldsProvider>
    )

    const input = screen.getByTestId('name-input')
    await user.clear(input)
    await user.type(input, 'Jane Doe')
    
    expect(screen.getByTestId('name-value')).toHaveTextContent('Jane Doe')
  })

  it('should handle setField updates', () => {
    interface TestFields {
      name: string
      email: string
    }

    const TestComponent = () => {
      const { fields, setField } = useFields<TestFields>()
      return (
        <div>
          <div data-testid="name-value">{fields.name}</div>
          <button 
            onClick={() => setField('name', 'Updated Name')}
            data-testid="update-name"
          >
            Update Name
          </button>
        </div>
      )
    }

    render(
      <FieldsProvider<TestFields> defaults={{ name: 'Initial', email: '' }}>
        <TestComponent />
      </FieldsProvider>
    )

    expect(screen.getByTestId('name-value')).toHaveTextContent('Initial')
    
    fireEvent.click(screen.getByTestId('update-name'))
    
    expect(screen.getByTestId('name-value')).toHaveTextContent('Updated Name')
  })

  it('should handle setFields bulk updates', () => {
    interface TestFields {
      name: string
      email: string
    }

    const TestComponent = () => {
      const { fields, setFields } = useFields<TestFields>()
      return (
        <div>
          <div data-testid="name-value">{fields.name}</div>
          <div data-testid="email-value">{fields.email}</div>
          <button 
            onClick={() => setFields({ name: 'New Name', email: 'new@example.com' })}
            data-testid="update-all"
          >
            Update All
          </button>
        </div>
      )
    }

    render(
      <FieldsProvider<TestFields> defaults={{ name: '', email: '' }}>
        <TestComponent />
      </FieldsProvider>
    )

    fireEvent.click(screen.getByTestId('update-all'))
    
    expect(screen.getByTestId('name-value')).toHaveTextContent('New Name')
    expect(screen.getByTestId('email-value')).toHaveTextContent('new@example.com')
  })

  it('should throw error when used outside provider', () => {
    const TestComponent = () => {
      useFields()
      return null
    }

    expect(() => render(<TestComponent />)).toThrow('useFields must be used within a FieldsProvider')
  })
})