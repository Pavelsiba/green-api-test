import { QueryClient } from "@tanstack/react-query"
import { isTransientError } from "./green-api"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < 3 && isTransientError(error)
    },
    mutations: {
      retry: false
    }
  }
})
