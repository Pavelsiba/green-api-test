import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const isDev = mode === "development"
  const env = isDev ? loadEnv(mode, process.cwd(), "VITE_") : {}

  return {
    base: "./",
    plugins: [react()],
    resolve: {
      tsconfigPaths: true
    },
    define: {
      __IS_DEV__: JSON.stringify(isDev),
      __API_URL__: JSON.stringify(env.VITE_API_URL ?? ""),
      __ID_INSTANCE__: JSON.stringify(env.VITE_ID_INSTANCE ?? ""),
      __API_TOKEN_INSTANCE__: JSON.stringify(env.VITE_API_TOKEN_INSTANCE ?? "")
    }
  }
})
