import { createRoot } from "react-dom/client"
import "@mantine/core/styles.css"
import "@/app/styles/index.css"
import { App } from "@/app/App"
import { AppProviders } from "@/app/entrypoint/AppProviders"

const root = document.getElementById("root")
if (!root) throw new Error("#root not found")

createRoot(root).render(
  <AppProviders>
    <App />
  </AppProviders>
)
