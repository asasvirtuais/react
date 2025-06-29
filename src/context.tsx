'use client'

import React from 'react'

export function createContextFromHook<Props, Result>(useHook: (props: Props) => Result) {

    const Context = React.createContext<Result | undefined>(undefined)

    function Provider( { children, ...props}: React.PropsWithChildren<Props> ) {

        const value = useHook(props as Props) as Result

        return <Context.Provider value={value}>{ children }</Context.Provider>
    }

    function useContext() {
        return React.useContext(Context) as Result
    }

    return [Provider, useContext] as const
}
