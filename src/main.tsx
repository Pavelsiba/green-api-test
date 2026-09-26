import { MantineProvider } from "@mantine/core"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { createRoot } from "react-dom/client"
import "@mantine/core/styles.css"
import "@/app/styles/index.css"
import { App } from "@/app/App"
import { queryClient } from "@/shared/api"
import { cssVariablesResolver, theme } from "@/shared/ui"

const root = document.getElementById("root")
if (!root) throw new Error("#root not found")

createRoot(root).render(
  <MantineProvider
    theme={theme}
    cssVariablesResolver={cssVariablesResolver}
    defaultColorScheme="auto"
  >
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools />
    </QueryClientProvider>
  </MantineProvider>
)
