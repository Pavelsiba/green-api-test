/**
 * Все способы, которыми падает вызов GREEN-API. HTTP 200 сам по себе не успех:
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

export class ApiError extends Error {
  readonly error: TApiErrorKind

  constructor(error: TApiErrorKind) {
    super(`ApiError: ${error.kind}`)
    this.error = error
    this.name = "ApiError"
  }
}

export const isUnauthorizedError = (error: unknown): boolean =>
  error instanceof ApiError && error.error.kind === "unauthorized"

export const isTransientError = (error: unknown): boolean =>
  !(error instanceof ApiError) ||
  error.error.kind === "network" ||
  error.error.kind === "rateLimited" ||
  (error.error.kind === "http" && error.error.status >= 500)

type THttpErrorBuilder = (message: string) => TApiErrorKind

const HTTP_ERROR_BY_STATUS: Record<number, THttpErrorBuilder> = {
  400: (message) => ({ kind: "validation", message }),
  401: () => ({ kind: "unauthorized" }),
  403: (message) => ({ kind: "suspended", message }),
  404: () => ({ kind: "unauthorized" }),
  429: () => ({ kind: "rateLimited" }),
  469: () => ({ kind: "contactLimit" })
}

export const getHttpError = (status: number, message: string): TApiErrorKind =>
  HTTP_ERROR_BY_STATUS[status]?.(message) ?? { kind: "http", status, message }
