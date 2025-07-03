import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAction, useIndex } from '../hooks'

describe('useAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const mockAction = vi.fn()
    const { result } = renderHook(() => 
      useAction(mockAction, { defaults: { param: 'test' } })
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeUndefined()
    expect(result.current.result).toBeUndefined()
    expect(result.current.defaults).toEqual({ param: 'test' })
  })

  it('should handle successful action execution', async () => {
    const mockAction = vi.fn().mockResolvedValue('success')
    const onSuccess = vi.fn()
    
    const { result } = renderHook(() => 
      useAction(mockAction, { onSuccess, defaults: { param: 'test' } })
    )

    await act(async () => {
      await result.current.trigger({ additional: 'data' })
    })

    expect(mockAction).toHaveBeenCalledWith({
      param: 'test',
      additional: 'data',
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.result).toBe('success')
    expect(onSuccess).toHaveBeenCalledWith('success')
  })

  it('should handle action errors', async () => {
    const mockError = new Error('Test error')
    const mockAction = vi.fn().mockRejectedValue(mockError)
    
    const { result } = renderHook(() => 
      useAction(mockAction, { defaults: {} })
    )

    await act(async () => {
      try {
        await result.current.trigger({})
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(mockError)
  })

  it('should prevent concurrent executions', async () => {
    const mockAction = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )
    
    const { result } = renderHook(() => 
      useAction(mockAction, { defaults: {} })
    )

    act(() => {
      result.current.trigger({})
    })
    
    expect(result.current.loading).toBe(true)
    
    const secondResult = await act(async () => {
      return result.current.trigger({})
    })

    expect(secondResult).toBeUndefined()
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('should auto-trigger when autoTrigger is true', async () => {
    const mockAction = vi.fn().mockResolvedValue('auto-triggered')
    
    renderHook(() => 
      useAction(mockAction, { autoTrigger: true, defaults: { param: 'test' } })
    )

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledWith({ param: 'test' })
    })
  })

  it('should update defaults', () => {
    const mockAction = vi.fn()
    const { result } = renderHook(() => 
      useAction(mockAction, { defaults: { param: 'initial' } })
    )

    act(() => {
      result.current.setDefaults({ param: 'updated' })
    })

    expect(result.current.defaults).toEqual({ param: 'updated' })
  })
})

describe('useIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with provided values', () => {
    const initialData = {
      '1': { id: '1', name: 'Item 1' },
      '2': { id: '2', name: 'Item 2' },
    }
    
    const { result } = renderHook(() => useIndex(initialData))

    expect(result.current.index).toEqual(initialData)
    expect(result.current.array).toEqual([
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ])
  })

  it('should add items to index', () => {
    const { result } = renderHook(() => useIndex({}))

    act(() => {
      result.current.set(
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      )
    })

    expect(result.current.index).toEqual({
      '1': { id: '1', name: 'Item 1' },
      '2': { id: '2', name: 'Item 2' },
    })
    expect(result.current.array).toHaveLength(2)
  })

  it('should update existing items', () => {
    const initialData = {
      '1': { id: '1', name: 'Item 1' },
    }
    
    const { result } = renderHook(() => useIndex(initialData))

    act(() => {
      result.current.set({ id: '1', name: 'Updated Item 1' })
    })

    expect(result.current.index['1'].name).toBe('Updated Item 1')
  })

  it('should remove items from index', () => {
    const initialData = {
      '1': { id: '1', name: 'Item 1' },
      '2': { id: '2', name: 'Item 2' },
    }
    
    const { result } = renderHook(() => useIndex(initialData))

    act(() => {
      result.current.remove({ id: '1', name: 'Item 1' })
    })

    expect(result.current.index).toEqual({
      '2': { id: '2', name: 'Item 2' },
    })
    expect(result.current.array).toHaveLength(1)
  })

  it('should handle removing non-existent items', () => {
    const initialData = {
      '1': { id: '1', name: 'Item 1' },
    }
    
    const { result } = renderHook(() => useIndex(initialData))

    act(() => {
      result.current.remove({ id: '999', name: 'Non-existent' })
    })

    expect(result.current.index).toEqual(initialData)
  })

  it('should allow direct index manipulation', () => {
    const { result } = renderHook(() => useIndex({}))

    act(() => {
      result.current.setIndex({
        '1': { id: '1', name: 'Direct Set' },
      })
    })

    expect(result.current.index).toEqual({
      '1': { id: '1', name: 'Direct Set' },
    })
  })
})