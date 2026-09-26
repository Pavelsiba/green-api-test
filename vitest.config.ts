import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config.ts"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/shared/lib/test-utils/setup-tests.ts"],
      include: ["src/**/*.{unit,integration}.test.{ts,tsx}"]
    }
  })
)
