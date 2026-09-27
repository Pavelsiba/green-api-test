import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSetAtom } from "jotai"
import type { TCredentials } from "@/shared/api"
import { instanceStateQueryOptions } from "../../api/auth-queries"
import { InstanceStateError } from "../../lib/instance-state-error"
import { credentialsAtom } from "../credentials-atom"

/**
 * Проверяет креды через `getStateInstance` и сохраняет их, только если инстанс `authorized`.
 * Ошибка — `ApiError` или `InstanceStateError`; текст для экрана даёт `getLoginErrorMessage`.
 */
export function useLogin() {
  const queryClient = useQueryClient()
  const setCredentials = useSetAtom(credentialsAtom)

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: async (credentials: TCredentials) => {
      const state = await queryClient.fetchQuery({
        ...instanceStateQueryOptions(credentials),
        staleTime: 0
      })
      if (state !== "authorized") throw new InstanceStateError(state)
      return credentials
    },
    onSuccess: (credentials) => setCredentials(credentials)
  })

  return { login: mutate, isPending, error, reset }
}
