import { Button } from "@mantine/core"
import { useLogout } from "../../model/hooks/use-logout"

export function LogoutButton() {
  const { logout } = useLogout()

  return (
    <Button variant="subtle" onClick={logout}>
      Выйти
    </Button>
  )
}
