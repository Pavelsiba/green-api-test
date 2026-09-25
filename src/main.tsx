import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/app/styles/index.css"
import { App } from "@/app/App"
import { queryClient } from "@/shared/api"

const root = document.getElementById("root")
if (!root) throw new Error("#root not found")

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>
)
