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
import "./contrast-tokens.css"

const max: MantineColorsTuple = [
  "#e5f2ff",
  "#cce4ff",
  "#99c9ff",
  "#66afff",
  "#479fff",
  "#1a88ff",
  "#0066d6",
  "#0059bb",
  "#004fa6",
  "#004490"
]

/**
 * Тема в духе MAX: шрифт, радиусы и размеры сняты с web.max.ru. Цвета Mantine через
 * `cssVariablesResolver` ссылаются на токены из `max-tokens.css`, поэтому тёмная схема
 * переключается сама вместе с `data-mantine-color-scheme`. Основной оттенок шкалы `max` —
 * `#0066d6`, темнее MAX `#007aff`: белый текст кнопки даёт 5.42:1 (WCAG AA) вместо 4.02:1.
 * У `Button` в `loading` текст гаснет, а лоадер проявляется на месте, без выезда и белой подложки
 * Mantine; `transform` лоадера Mantine пишет инлайн, поэтому в CSS он с `!important`.
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
    Button: Button.extend({
      classNames: { root: cls.button, inner: cls.buttonInner, loader: cls.buttonLoader }
    })
  }
})

const sharedVariables = {
  "--mantine-color-body": "var(--background-secondary)",
  "--mantine-color-text": "var(--text-primary)",
  "--mantine-color-dimmed": "var(--text-tertiary)",
  "--mantine-color-error": "var(--text-negative)",
  "--mantine-color-placeholder": "var(--text-mute)"
}

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: sharedVariables,
  dark: sharedVariables
})
