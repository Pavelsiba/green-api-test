import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createStore, Provider } from "jotai"
import type { ReactNode } from "react"

/**
 * Свежие QueryClient и jotai-store на каждый тест: без ретраев, без сборки мусора
 * посреди проверки и без состояния атомов, утёкшего из соседнего теста.
 */
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false }
    }
  })
  const store = createStore()

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>
    </MantineProvider>
  )

  return { queryClient, store, wrapper }
}
