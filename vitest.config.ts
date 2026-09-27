import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config.ts"

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      environment: "jsdom",
      setupFiles: ["./src/shared/lib/test-utils/setup-tests.ts"],
      include: ["src/**/*.{unit,integration}.test.{ts,tsx}"]
    }
  })
)
