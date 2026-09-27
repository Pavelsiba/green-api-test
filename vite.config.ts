import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === "development"
  // креды из .env нужны только для автозаполнения формы входа в dev: в тестах и сборке
  // константы пустые, поэтому в бандл не попадают, даже если на них сошлются вне формы
  const env = isDev ? loadEnv(mode, process.cwd(), "VITE_") : {}

  return {
    // относительные пути к ассетам: сборка работает и из корня домена, и из
    // подпапки GitHub Pages (/green-api-test/). Роутера нет, поэтому это безопасно
    base: "./",
    plugins: [react()],
    resolve: {
      // алиас @/ берётся из paths в tsconfig.json
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
