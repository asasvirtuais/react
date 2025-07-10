'use client'
import { createContextFromHook } from './context'
import React, { useCallback, useEffect, useState } from 'react'
import { createContext } from 'react'

type FieldProps = {
    defaultValue: any
    handle?: (value?: any) => void
}

function useFieldProvider( { defaultValue, handle } : FieldProps ) {
    const [value, setValue] = useState(defaultValue)

    useEffect(() => setValue(defaultValue), [])

    const onChange = useCallback((e: any) => {
        e?.preventDefault()
        const value = e.target.value
        setValue(value)
        if (handle)
            handle(value)
    }, [handle])

    return {
        value,
        setValue,
        handle,
        defaultValue,
        onChange,
    }
}

export const [FieldProvider, useField] = createContextFromHook(useFieldProvider)

type FieldsProps<T> = { defaults: T }

function useFieldsProvider<T>(props: FieldsProps<T>) {

    const [fields, setFields] = useState(props.defaults)

    useEffect(() => {
        setFields(props.defaults)
    }, [])

    const register = useCallback(
        function<K extends keyof T>(name: K) {
            const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                const { name: fieldName, value } = e.target
                setFields(prev => ({ ...prev, [fieldName]: value }))
            }

            return {
                name: name,
                id: name as string,
                value: fields[name] ?? '',
                onChange: handleChange,
            }
        },
        [fields]
    )

    const setField = useCallback(
        <K extends keyof T>(name: K, value: T[K]) => {
            setFields(prev => ({ ...prev, [name]: value }))
        },
        [setFields, fields]
    )

    return {
        fields,
        setFields,
        register,
        setField,
    }
}

export const Context = createContext<ReturnType<typeof useFieldsProvider<any>> | undefined>(undefined)

export function FieldsProvider<T>({children, ...props}: FieldsProps<T> & {
    children: React.ReactNode | ((value: ReturnType<typeof useFieldsProvider<T>>) => React.ReactNode)
}) {

    const value = useFieldsProvider<T>(props)

    return (
        <Context.Provider value={value}>
            {typeof children === 'function' ? children(value) : children}
        </Context.Provider>
    )
}

export const useFields = <T,>() => {
    const context = React.useContext(Context)
    if (context === undefined) {
        throw new Error('useFields must be used within a FieldsProvider')
    }
    return context as ReturnType<typeof useFieldsProvider<T>>
}
