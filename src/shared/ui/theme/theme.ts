import {
  Button,
  type CSSVariablesResolver,
  createTheme,
  Input,
  InputWrapper,
  type MantineColorsTuple
} from "@mantine/core"
import cls from "./theme.module.css"
import "./max-tokens.css"

/** Шкала вокруг `--button-primary` MAX (#007aff): 4 — hover, 6 — основной, 7 — pressed */
const max: MantineColorsTuple = [
  "#e5f2ff",
  "#cce4ff",
  "#99c9ff",
  "#66afff",
  "#479fff",
  "#1a88ff",
  "#007aff",
  "#006ee5",
  "#0062cc",
  "#0055b3"
]

/**
 * Тема в духе MAX: шрифт, радиусы и размеры сняты с web.max.ru.
 * Цвета Mantine ссылаются на токены из `max-tokens.css`, поэтому тёмная схема
 * переключается сама вместе с `data-mantine-color-scheme`.
 */
export const theme = createTheme({
  primaryColor: "max",
  primaryShade: 6,
  colors: { max },
  fontFamily:
    "-apple-system, BlinkMacSystemFont, Roboto, system-ui, Avenir, Helvetica, Arial, sans-serif",
  headings: { fontWeight: "600" },
  radius: { xs: "8px", sm: "12px", md: "16px", lg: "20px", xl: "24px" },
  defaultRadius: "md",
  components: {
    Input: Input.extend({ classNames: { input: cls.input } }),
    InputWrapper: InputWrapper.extend({
      classNames: { label: cls.label, error: cls.hint, description: cls.hint }
    }),
    Button: Button.extend({ classNames: { root: cls.button } })
  }
})

const sharedVariables = {
  "--mantine-color-body": "var(--background-secondary)",
  "--mantine-color-text": "var(--text-primary)",
  "--mantine-color-dimmed": "var(--text-tertiary)",
  "--mantine-color-error": "var(--text-negative)",
  "--mantine-color-placeholder": "var(--text-mute)"
}

/** Базовые цвета Mantine берутся из палитры MAX в обеих схемах */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: sharedVariables,
  dark: sharedVariables
})
