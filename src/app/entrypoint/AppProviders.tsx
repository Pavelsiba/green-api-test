import { MantineProvider } from "@mantine/core"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { ReactNode } from "react"
import { queryClient } from "@/shared/api"
import { cssVariablesResolver, theme } from "../styles/theme"

/**
 * Провайдеры приложения: тема MAX для Mantine (схема по умолчанию — системная) и общий
 * QueryClient, который служит хранилищем сообщений. Devtools TanStack Query попадают только в dev.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="auto"
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools />
      </QueryClientProvider>
    </MantineProvider>
  )
}
