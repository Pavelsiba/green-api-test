import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { isUnauthorizedError } from "@/shared/api"
import { useCredentials } from "./use-credentials"
import { useLogout } from "./use-logout"

/**
 * Выход на экран входа, если во время сессии любой запрос или мутация получили 401/404:
 * креды больше не действуют (токен перевыпущен, инстанс удалён). Пока пользователь не вошёл,
 * не срабатывает — неверные креды на форме входа показываются как ошибка формы.
 */
export function useLogoutOnUnauthorized() {
  const queryClient = useQueryClient()
  const isLoggedIn = useCredentials() !== null
  const { logout } = useLogout()

  useEffect(() => {
    if (!isLoggedIn) return

    let isLoggingOut = false
    const handleError = (error: unknown) => {
      if (isLoggingOut || !isUnauthorizedError(error)) return
      isLoggingOut = true
      logout()
    }

    const unsubscribeQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") handleError(event.action.error)
    })
    const unsubscribeMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") handleError(event.action.error)
    })

    return () => {
      unsubscribeQueries()
      unsubscribeMutations()
    }
  }, [isLoggedIn, logout, queryClient])
}
