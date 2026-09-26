import { ApiError, type TApiErrorKind } from "@/shared/api"
import { InstanceStateError } from "./instance-state-error"

// Все тексты — не длиннее двух строк слота ошибки на ширине 320px, иначе форма прыгнет
const MESSAGE_BY_STATE: Record<string, string> = {
  notAuthorized: "Инстанс не привязан к WhatsApp: отсканируйте QR-код в личном кабинете",
  blocked: "Номер заблокирован в WhatsApp",
  sleepMode: "Телефон не в сети: проверьте, что WhatsApp на нём запущен",
  starting: "Инстанс запускается. Повторите через пару минут",
  yellowCard: "WhatsApp ограничил отправку с этого номера (жёлтая карточка)",
  suspended: "Инстанс приостановлен: проверьте оплату в личном кабинете"
}

const MESSAGE_BY_KIND: Partial<Record<TApiErrorKind["kind"], string>> = {
  unauthorized: "Неверный idInstance или apiTokenInstance",
  network: "Сервер недоступен: проверьте apiUrl и подключение к интернету",
  suspended: "Аккаунт GREEN-API заблокирован",
  rateLimited: "Слишком много запросов. Подождите секунду и повторите"
}

/** Текст ошибки входа для пользователя */
export const getLoginErrorMessage = (error: unknown): string => {
  if (error instanceof InstanceStateError) {
    return MESSAGE_BY_STATE[error.state] ?? `Инстанс не готов: состояние «${error.state}»`
  }
  if (error instanceof ApiError) {
    return (
      MESSAGE_BY_KIND[error.error.kind] ?? `Ошибка сервера (${error.error.kind}). Попробуйте позже`
    )
  }
  return "Не удалось войти. Попробуйте ещё раз"
}
