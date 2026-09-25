import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config.ts"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["@testing-library/jest-dom/vitest"],
      include: ["src/**/*.{unit,integration}.test.{ts,tsx}"]
    }
  })
)
