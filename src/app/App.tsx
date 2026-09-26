import { Group } from "@mantine/core"
import { LogoutButton, useCredentials } from "@/features/auth"
import { LoginPage } from "@/pages/login"

export function App() {
  const credentials = useCredentials()

  if (!credentials) return <LoginPage />

  // заглушка до экрана чата
  return (
    <Group component="main" justify="space-between" p="md">
      GREEN-API чат · инстанс {credentials.idInstance}
      <LogoutButton />
    </Group>
  )
}
