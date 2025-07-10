'use client'

import { useIndex } from './hooks'
import { createContextFromHook } from './context'

type StoreProps<T> = {
    [table: string]: (T & { id: string })[]
}

function useStoreProvider<T>(props : StoreProps<T>) {
    return Object.fromEntries(
        Object.entries(props).map(
            ([table, initial]) => [table, useIndex<T>({ initial: initial as T & { id: string }[] })]
        )
    ) as {
        [table: string]: ReturnType<typeof useIndex<T>>
    }
}

export const [StoreProvider, useStore] = createContextFromHook(useStoreProvider<any>)
