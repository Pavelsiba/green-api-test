import { isUnauthorizedError } from "@/shared/api"

const POLL_INTERVAL_MS = 1000
const ERROR_INTERVAL_MS = 5000

/**
 * Пауза между опросами: 1 с, после сбоя 5 с, `false` на `unauthorized` — креды отозваны.
 * Пустой ответ сервер и так держит ~5 с (long-polling), а тик во время идущего запроса
 * TanStack Query пропускает.
 */
export function getPollInterval(error: unknown): number | false {
  if (isUnauthorizedError(error)) return false
  return error ? ERROR_INTERVAL_MS : POLL_INTERVAL_MS
}
