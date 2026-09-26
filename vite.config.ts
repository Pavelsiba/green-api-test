import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // относительные пути к ассетам: сборка работает и из корня домена, и из
  // подпапки GitHub Pages (/green-api-test/). Роутера нет, поэтому это безопасно
  base: "./",
  plugins: [react()],
  resolve: {
    // алиас @/ берётся из paths в tsconfig.json
    tsconfigPaths: true
  }
})
