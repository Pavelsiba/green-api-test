import { useQueryClient } from "@tanstack/react-query"
import { useSetAtom } from "jotai"
import { RESET } from "jotai/utils"
import { credentialsAtom } from "../credentials-atom"

/** Забывает креды и весь кэш: данные чужого инстанса не должны пережить смену аккаунта */
export function useLogout() {
  const queryClient = useQueryClient()
  const setCredentials = useSetAtom(credentialsAtom)

  const logout = () => {
    setCredentials(RESET)
    queryClient.clear()
  }

  return { logout }
}
