import { queryOptions } from "@tanstack/react-query"
import { greenApi, type TCredentials } from "@/shared/api"

/** Адресация состояния инстанса в кэше TanStack Query */
export const authQueryKeys = {
  all: ["auth"] as const,
  instanceState: (idInstance: string) => [...authQueryKeys.all, idInstance, "state"] as const
}

/**
 * Проверка кредов через `getStateInstance`. Креды передаются явно:
 * на экране входа их проверяют до сохранения. Лимит метода — 1 запрос/с,
 * поэтому без автоповторов по фокусу окна.
 */
export const instanceStateQueryOptions = (credentials: TCredentials) =>
  queryOptions({
    queryKey: authQueryKeys.instanceState(credentials.idInstance),
    queryFn: ({ signal }) => greenApi.getStateInstance({ signal, auth: credentials }),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false
  })
