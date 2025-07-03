import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FormProvider, useForm } from '../forms'
import { FieldsProvider, useFields } from '../fields'
import userEvent from '@testing-library/user-event'

describe('FormProvider and useForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide form context with submit, result, loading, and error', () => {
    interface TestFields {
      name: string
    }

    const TestComponent = () => {
      const { submit, result, loading, error } = useForm<TestFields, string>()
      return (
        <div>
          <div data-testid="loading">{loading ? 'true' : 'false'}</div>
          <div data-testid="result">{result || 'no result'}</div>
          <div data-testid="error">{error?.message || 'no error'}</div>
          <button onClick={submit} data-testid="submit">Submit</button>
        </div>
      )
    }

    render(
      <FieldsProvider<TestFields> defaults={{ name: 'test' }}>
        <FormProvider<TestFields, string>>
          <TestComponent />
        </FormProvider>
      </FieldsProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('result')).toHaveTextContent('no result')
    expect(screen.getByTestId('error')).toHaveTextContent('no error')
  })

  it('should handle successful form submission', async () => {
    interface TestFields {
      name: string
    }

    const onSubmit = vi.fn().mockResolvedValue('success')

    const TestComponent = () => {
      const { submit, result, loading } = useForm<TestFields, string>()
      return (
        <div>
          <div data-testid="loading">{loading ? 'true' : 'false'}</div>
          <div data-testid="result">{result || 'no result'}</div>
          <button onClick={submit} data-testid="submit">Submit</button>
        </div>
      )
    }

    render(
      <FieldsProvider<TestFields> defaults={{ name: 'test' }}>
        <FormProvider<TestFields, string> onSubmit={onSubmit}>
          <TestComponent />
        </FormProvider>
      </FieldsProvider>
    )

    fireEvent.click(screen.getByTestId('submit'))

    // Should be loading initially
    expect(screen.getByTestId('loading')).toHaveTextContent('true')

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('result')).toHaveTextContent('success')
    })

    expect(onSubmit).toHaveBeenCalledWith({ name: 'test' })
  })

  it('should handle form submission errors', async () => {
    interface TestFields {
      name: string
    }

    const error = new Error('Submission failed')
    const onSubmit = vi.fn().mockRejectedValue(error)

    const TestComponent = () => {
      const { submit, loading, error: formError } = useForm<TestFields, string>()
      return (
        <div>
          <div data-testid="loading">{loading ? 'true' : 'false'}</div>
          <div data-testid="error">{formError?.message || 'no error'}</div>
          <button onClick={submit} data-testid="submit">Submit</button>
        </div>
      )
    }

    render(
      <FieldsProvider<TestFields> defaults={{ name: 'test' }}>
        <FormProvider<TestFields, string> onSubmit={onSubmit}>
          <TestComponent />
        </FormProvider>
      </FieldsProvider>
    )

    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('error')).toHaveTextContent('Submission failed')
    })
  })

  it('should handle form submission with preventDefault', async () => {
    interface TestFields {
      name: string
    }

    const onSubmit = vi.fn().mockResolvedValue('success')

    const TestComponent = () => {
      const { submit } = useForm<TestFields, string>()
      return (
        <form onSubmit={submit} data-testid="form">
          <button type="submit" data-testid="submit">Submit</button>
        </form>
      )
    }

    render(
      <FieldsProvider<TestFields> defaults={{ name: 'test' }}>
        <FormProvider<TestFields, string> onSubmit={onSubmit}>
          <TestComponent />
        </FormProvider>
      </FieldsProvider>
    )

    const form = screen.getByTestId('form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: 'test' })
    })
  })

  it('should integrate with fields for form data', async () => {
    const user = userEvent.setup()
    
    interface TestFields {
      name: string
      email: string
    }

    const onSubmit = vi.fn().mockResolvedValue('success')

    const TestComponent = () => {
      const { register } = useFields<TestFields>()
      const { submit } = useForm<TestFields, string>()
      
      return (
        <form onSubmit={submit}>
          <input {...register('name')} data-testid="name-input" />
          <input {...register('email')} data-testid="email-input" />
          <button type="submit" data-testid="submit">Submit</button>
        </form>
      )
    }

    render(
      <FieldsProvider<TestFields> defaults={{ name: '', email: '' }}>
        <FormProvider<TestFields, string> onSubmit={onSubmit}>
          <TestComponent />
        </FormProvider>
      </FieldsProvider>
    )

    // Fill out the form
    await user.type(screen.getByTestId('name-input'), 'John Doe')
    await user.type(screen.getByTestId('email-input'), 'john@example.com')
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      })
    })
  })

  it('should throw error when used outside provider', () => {
    const TestComponent = () => {
      useForm()
      return null
    }

    expect(() => render(<TestComponent />)).toThrow('useForm must be used within a FormProvider')
  })

  it('should handle submission when onSubmit is not provided', async () => {
    interface TestFields {
      name: string
    }

    const TestComponent = () => {
      const { submit, result } = useForm<TestFields, string>()
      return (
        <div>
          <div data-testid="result">{result || 'no result'}</div>
          <button onClick={submit} data-testid="submit">Submit</button>
        </div>
      )
    }

    render(
      <FieldsProvider<TestFields> defaults={{ name: 'test' }}>
        <FormProvider<TestFields, string>>
          <TestComponent />
        </FormProvider>
      </FieldsProvider>
    )

    fireEvent.click(screen.getByTestId('submit'))

    // Should handle gracefully when no onSubmit is provided
    expect(screen.getByTestId('result')).toHaveTextContent('no result')
  })
})