import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from "@mantine/core"
import { Moon, Sun } from "lucide-react"
import cls from "./ThemeSwitcher.module.css"

/**
 * Светлая ↔ тёмная тема. Пока пользователь не нажал, тема следует за системной (`auto`);
 * выбор Mantine хранит в localStorage. Какая иконка видна, решает CSS по атрибуту
 * `data-mantine-color-scheme`, а не состояние React.
 */
export function ThemeSwitcher() {
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true })

  const toggle = () => setColorScheme(computedColorScheme === "light" ? "dark" : "light")

  return (
    <ActionIcon
      className={cls.switcher}
      variant="subtle"
      color="gray"
      size={40}
      radius="xl"
      onClick={toggle}
      aria-label="Сменить тему"
      title="Сменить тему"
    >
      <Moon className={cls.toDark} size={20} strokeWidth={1.75} />
      <Sun className={cls.toLight} size={20} strokeWidth={1.75} />
    </ActionIcon>
  )
}
