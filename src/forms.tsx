"use client"
import React, { createContext, useContext as useReactContext } from "react"
import { PropsWithChildren, useCallback, useState } from "react"
import { useFields } from "./fields"

const FormReactContext = createContext<
  ReturnType<typeof useFormHook<any, any>> | undefined
>(undefined)

type FormProviderProps<Fields, Result> = {
  onSubmit?: (fields: Fields) => Promise<Result>
  children: React.ReactNode | ((value: ReturnType<typeof useFormHook<Fields, Result>>) => React.ReactNode)
}

function useFormHook<Fields, Result>(props: FormProviderProps<Fields, Result>) {
  const fields = useFields<Fields>()
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const submit = useCallback(
    async (e?: any) => {
      e?.preventDefault?.()
      setLoading(true)
      setError(null)
      try {
        if (props.onSubmit && fields.fields) {
          const result = await props.onSubmit(fields.fields)
          console.log(result)
          setResult(result)
        }
      } catch (err) {
        console.error("Form submission failed:", err)
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
      return false
    },
    [fields.fields, props.onSubmit]
  )

  return {
    fields,
    submit,
    result,
    loading,
    error,
  }
}

export function FormProvider<Fields, Result>({
  children,
  ...props
}: FormProviderProps<Fields, Result>) {
  const value = useFormHook(props)
  return (
    <FormReactContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </FormReactContext.Provider>
  )
}

export const useForm = <Fields, Result>() => {
  const context = useReactContext(FormReactContext)
  if (context === undefined) {
    throw new Error("useForm must be used within a FormProvider")
  }
  return context as ReturnType<typeof useFormHook<Fields, Result>>
}
