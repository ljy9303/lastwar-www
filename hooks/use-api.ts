"use client"

import { useState, useCallback } from "react"
import { fetchFromAPI } from "@/lib/api-service-hybrid"

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useApi<T = any, P = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  options?: UseApiOptions<T>,
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const execute = useCallback(
    async (payload?: P) => {
      setIsLoading(true)
      setError(null)

      try {
        const requestOptions: RequestInit = {
          method,
        }

        if (payload) {
          requestOptions.body = JSON.stringify(payload)
        }

        const result = await fetchFromAPI(endpoint, requestOptions)
        setData(result)
        options?.onSuccess?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [endpoint, method, options],
  )

  return {
    data,
    error,
    isLoading,
    execute,
  }
}
