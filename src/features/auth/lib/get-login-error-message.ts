import { isApiError, type TApiErrorKind } from "@/shared/api"
import { isAuthError } from "./auth-error"

const FALLBACK_MESSAGE = "Не удалось войти. Попробуйте ещё раз"

const MESSAGE_BY_STATE: Record<string, string> = {
  notAuthorized: "Инстанс не привязан к WhatsApp: отсканируйте QR-код в личном кабинете",
  blocked: "Номер заблокирован в WhatsApp",
  sleepMode: "Телефон не в сети: проверьте, что WhatsApp на нём запущен",
  starting: "Инстанс запускается. Повторите через пару минут",
  yellowCard: "WhatsApp ограничил отправку с этого номера (жёлтая карточка)",
  suspended: "Инстанс приостановлен: проверьте оплату в личном кабинете"
}

const MESSAGE_BY_API_KIND: Partial<Record<TApiErrorKind["kind"], string>> = {
  unauthorized: "Неверный idInstance или apiTokenInstance",
  network: "Сервер недоступен: проверьте apiUrl и подключение к интернету",
  suspended: "Аккаунт GREEN-API заблокирован",
  rateLimited: "Слишком много запросов. Подождите секунду и повторите"
}

const UNKNOWN_STATE_MESSAGE = (state: string) => `Инстанс не готов: состояние «${state}»`

const UNKNOWN_API_KIND_MESSAGE = (kind: string) => `Ошибка сервера (${kind}). Попробуйте позже`

/** Текст ошибки входа для пользователя */
export const getLoginErrorMessage = (error: unknown): string => {
  if (isAuthError(error)) {
    const { state } = error.detail
    return MESSAGE_BY_STATE[state] ?? UNKNOWN_STATE_MESSAGE(state)
  }
  if (isApiError(error)) {
    const { kind } = error.detail
    return MESSAGE_BY_API_KIND[kind] ?? UNKNOWN_API_KIND_MESSAGE(kind)
  }
  return FALLBACK_MESSAGE
}
