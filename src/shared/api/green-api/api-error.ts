import { AppError, isAppError } from "@/shared/lib"

/**
 * Ошибки транспорта GREEN-API — `AppError` с источником `api`. HTTP 200 сам по себе не успех:
 * `{ status: false, reason }` приходит с 200 и становится `rejected`. 401 и 404 (неизвестный
 * idInstance) — `unauthorized`, 403 — `suspended`, 469 — `contactLimit`: его нельзя
 * повторять, повтор включает антифрод. Повторяются только временные сбои (`isTransientError`).
 */
export type TApiErrorKind =
  | { kind: "network"; message: string }
  | { kind: "unauthorized" }
  | { kind: "suspended"; message: string }
  | { kind: "validation"; message: string }
  | { kind: "rateLimited" }
  | { kind: "contactLimit" }
  | { kind: "rejected"; reason: string }
  | { kind: "http"; status: number; message: string }
  | { kind: "badResponse"; message: string }

type THttpErrorBuilder = (message: string) => TApiErrorKind

const API_SOURCE = "api"

const API_ERROR_KINDS: Record<TApiErrorKind["kind"], true> = {
  network: true,
  unauthorized: true,
  suspended: true,
  validation: true,
  rateLimited: true,
  contactLimit: true,
  rejected: true,
  http: true,
  badResponse: true
}

const HTTP_ERROR_BY_STATUS: Record<number, THttpErrorBuilder> = {
  400: (message) => ({ kind: "validation", message }),
  401: () => ({ kind: "unauthorized" }),
  403: (message) => ({ kind: "suspended", message }),
  404: () => ({ kind: "unauthorized" }),
  429: () => ({ kind: "rateLimited" }),
  469: () => ({ kind: "contactLimit" })
}

export const createApiError = (detail: TApiErrorKind) => new AppError(API_SOURCE, detail)

export const isApiError = (error: unknown) =>
  isAppError<typeof API_SOURCE, TApiErrorKind>(error, API_SOURCE, Object.keys(API_ERROR_KINDS))

export const isUnauthorizedError = (error: unknown): boolean =>
  isApiError(error) && error.detail.kind === "unauthorized"

export const isTransientError = (error: unknown): boolean => {
  if (!isApiError(error)) return !(error instanceof AppError)
  const { detail } = error
  return (
    detail.kind === "network" ||
    detail.kind === "rateLimited" ||
    (detail.kind === "http" && detail.status >= 500)
  )
}

export const getHttpError = (status: number, message: string): TApiErrorKind =>
  HTTP_ERROR_BY_STATUS[status]?.(message) ?? { kind: "http", status, message }
