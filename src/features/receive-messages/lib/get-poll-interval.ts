import { ApiError } from "@/shared/api"

/**
 * Пауза между опросами. Пустой ответ сервер и так держит ~5 с (long-polling), а тик интервала
 * во время идущего запроса TanStack Query пропускает — после ответа следующий уходит за ≤1 с.
 */
const POLL_INTERVAL_MS = 1000
/** После сбоя (запросы с ретраями уже исчерпаны) — реже, чтобы не долбить API */
const ERROR_INTERVAL_MS = 5000

/** `false` — опрос остановлен: креды отозваны, повторять бессмысленно */
export function getPollInterval(error: unknown): number | false {
  if (error instanceof ApiError && error.error.kind === "unauthorized") return false
  return error ? ERROR_INTERVAL_MS : POLL_INTERVAL_MS
}
