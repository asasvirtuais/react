import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createContextFromHook } from '../context'
import { useCallback, useState } from 'react'

describe('createContextFromHook', () => {
  it('should create a provider and context hook', () => {
    const useTestHook = (props: { initialValue: string }) => {
      const [value, setValue] = useState(props.initialValue)
      return { value, setValue }
    }

    const [TestProvider, useTestContext] = createContextFromHook(useTestHook)

    expect(TestProvider).toBeDefined()
    expect(useTestContext).toBeDefined()
  })

  it('should provide hook values to children', () => {
    const useTestHook = (props: { initialValue: string }) => {
      const [value, setValue] = useState(props.initialValue)
      return { value, setValue }
    }

    const [TestProvider, useTestContext] = createContextFromHook(useTestHook)

    const TestChild = () => {
      const { value } = useTestContext()
      return <div data-testid="value">{value}</div>
    }

    render(
      <TestProvider initialValue="test-value">
        <TestChild />
      </TestProvider>
    )

    expect(screen.getByTestId('value')).toHaveTextContent('test-value')
  })

  it('should update context when hook state changes', () => {
    const useTestHook = (props: { initialValue: string }) => {
      const [value, setValue] = useState(props.initialValue)
      const increment = useCallback(() => setValue(v => v + '!'), [])
      return { value, setValue, increment }
    }

    const [TestProvider, useTestContext] = createContextFromHook(useTestHook)

    const TestChild = () => {
      const { value, increment } = useTestContext()
      return (
        <div>
          <div data-testid="value">{value}</div>
          <button onClick={increment} data-testid="increment">
            Increment
          </button>
        </div>
      )
    }

    render(
      <TestProvider initialValue="test">
        <TestChild />
      </TestProvider>
    )

    expect(screen.getByTestId('value')).toHaveTextContent('test')
    
    screen.getByTestId('increment').click()
    
    expect(screen.getByTestId('value')).toHaveTextContent('test!')
  })

  it('should handle complex hook return values', () => {
    interface TestHookReturn {
      data: { id: string; name: string }[]
      loading: boolean
      error: string | null
      addItem: (item: { id: string; name: string }) => void
    }

    const useTestHook = (props: { initialData: { id: string; name: string }[] }): TestHookReturn => {
      const [data, setData] = useState(props.initialData)
      const [loading, setLoading] = useState(false)
      const [error, setError] = useState<string | null>(null)

      const addItem = useCallback((item: { id: string; name: string }) => {
        setData(prev => [...prev, item])
      }, [])

      return { data, loading, error, addItem }
    }

    const [TestProvider, useTestContext] = createContextFromHook(useTestHook)

    const TestChild = () => {
      const { data, addItem } = useTestContext()
      return (
        <div>
          <div data-testid="count">{data.length}</div>
          <button 
            onClick={() => addItem({ id: 'new', name: 'New Item' })}
            data-testid="add"
          >
            Add
          </button>
        </div>
      )
    }

    render(
      <TestProvider initialData={[{ id: '1', name: 'Item 1' }]}>
        <TestChild />
      </TestProvider>
    )

    expect(screen.getByTestId('count')).toHaveTextContent('1')
    
    screen.getByTestId('add').click()
    
    expect(screen.getByTestId('count')).toHaveTextContent('2')
  })
})