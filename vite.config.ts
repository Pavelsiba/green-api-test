import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // алиас @/ берётся из paths в tsconfig.json
    tsconfigPaths: true
  }
})
