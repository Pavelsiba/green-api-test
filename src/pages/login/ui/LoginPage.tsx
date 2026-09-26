import { LoginForm } from "@/features/auth"
import { ThemeSwitcher } from "@/features/theme-switcher"
import cls from "./LoginPage.module.css"

export function LoginPage() {
  return (
    <main className={cls.page}>
      <div className={cls.corner}>
        <ThemeSwitcher />
      </div>
      <LoginForm />
    </main>
  )
}
