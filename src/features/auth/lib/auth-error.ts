import { AppError, isAppError } from "@/shared/lib"

type TAuthErrorDetail = { kind: "instanceState"; state: string }

const AUTH_SOURCE = "auth"

const AUTH_KINDS: readonly TAuthErrorDetail["kind"][] = ["instanceState"]

/**
 * Ошибки входа — `AppError` с источником `auth`. `instanceState`: креды верные, но инстанс
 * не готов отправлять сообщения (`stateInstance` ≠ `authorized`).
 */
export const createInstanceStateError = (state: string) =>
  new AppError(AUTH_SOURCE, { kind: "instanceState", state })

export const isAuthError = (error: unknown) =>
  isAppError<typeof AUTH_SOURCE, TAuthErrorDetail>(error, AUTH_SOURCE, AUTH_KINDS)
