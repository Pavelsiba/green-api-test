import fsd from "@feature-sliced/steiger-plugin"
import { defineConfig } from "steiger"

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // слайсы появляются раньше потребителей; как в autopartsAI
      "fsd/insignificant-slice": "off"
    }
  }
])
