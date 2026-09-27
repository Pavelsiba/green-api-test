/**
 * Все способы, которыми падает вызов GREEN-API. HTTP 200 сам по себе не успех:
 * `{ status: false, reason }` приходит с 200 и становится `rejected`.
 */
export type TApiErrorKind =
  /** fetch бросил исключение: нет сети, DNS, провайдер режет TLS */
  | { kind: "network"; message: string }
  /** 401 — неверный токен, 404 — неизвестный idInstance, или кредов ещё нет */
  | { kind: "unauthorized" }
  /** 403 `Your account is suspended` */
  | { kind: "suspended"; message: string }
  /** 400 с `{ statusCode, message }` или текстом */
  | { kind: "validation"; message: string }
  | { kind: "rateLimited" }
  /** 469 `User get contact info limit reached`: вендор советует пауза 2 часа */
  | { kind: "contactLimit" }
  /** HTTP 200 с `{ status: false, reason }` */
  | { kind: "rejected"; reason: string }
  | { kind: "http"; status: number; message: string }
  /** тело не JSON, пустое или не прошло схему */
  | { kind: "badResponse"; message: string }

export class ApiError extends Error {
  readonly error: TApiErrorKind

  constructor(error: TApiErrorKind) {
    super(`ApiError: ${error.kind}`)
    this.error = error
    this.name = "ApiError"
  }
}

/** Креды не действуют: неверный или перевыпущенный токен, удалённый инстанс, кредов нет */
export const isUnauthorizedError = (error: unknown): boolean =>
  error instanceof ApiError && error.error.kind === "unauthorized"

/** Повторять имеет смысл только временные сбои. Повтор 469 — ровно то, за что включается антифрод. */
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

/** Возвращает вид ошибки по HTTP-статусу; незнакомый статус — `http` с кодом и текстом. */
export const getHttpError = (status: number, message: string): TApiErrorKind =>
  HTTP_ERROR_BY_STATUS[status]?.(message) ?? { kind: "http", status, message }
