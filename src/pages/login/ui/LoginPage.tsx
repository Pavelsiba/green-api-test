import { LoginForm } from "@/features/auth"
import cls from "./LoginPage.module.css"

export function LoginPage() {
  return (
    <main className={cls.page}>
      <LoginForm />
    </main>
  )
}
