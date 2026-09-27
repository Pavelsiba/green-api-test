import { useQueryClient } from "@tanstack/react-query"
import { useSetAtom } from "jotai"
import { RESET } from "jotai/utils"
import { useCallback } from "react"
import { credentialsAtom } from "../credentials-atom"

/** Забывает креды и весь кэш: данные чужого инстанса не должны пережить смену аккаунта */
export function useLogout() {
  const queryClient = useQueryClient()
  const setCredentials = useSetAtom(credentialsAtom)

  const logout = useCallback(() => {
    setCredentials(RESET)
    queryClient.clear()
  }, [queryClient, setCredentials])

  return { logout }
}
