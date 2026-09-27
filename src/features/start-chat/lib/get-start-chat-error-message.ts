import { isApiError, type TApiErrorKind } from "@/shared/api"
import { AppError, isAppError } from "@/shared/lib"

const START_CHAT_KINDS = ["noWhatsapp"] as const

type TStartChatErrorDetail = { kind: (typeof START_CHAT_KINDS)[number] }

const START_CHAT_SOURCE = "start-chat"

const FALLBACK_MESSAGE = "Не удалось проверить номер"

const MESSAGE_BY_START_CHAT_KIND: Record<TStartChatErrorDetail["kind"], string> = {
  noWhatsapp: "Этот номер не зарегистрирован в WhatsApp"
}

const MESSAGE_BY_API_KIND: Partial<Record<TApiErrorKind["kind"], string>> = {
  contactLimit: "Лимит проверок номеров исчерпан, попробуйте через 2 часа",
  network: "Нет связи с сервером",
  rateLimited: "Слишком часто, подождите секунду",
  validation: "Сервер не принял номер"
}

const isStartChatError = (error: unknown) =>
  isAppError<typeof START_CHAT_SOURCE, TStartChatErrorDetail>(
    error,
    START_CHAT_SOURCE,
    START_CHAT_KINDS
  )

/**
 * Ошибки открытия чата по номеру и их текст для пользователя. `noWhatsapp` — `AppError`
 * источника `start-chat`: номер валиден, но WhatsApp на нём нет.
 */
export const createNoWhatsappError = () => new AppError(START_CHAT_SOURCE, { kind: "noWhatsapp" })

export function getStartChatErrorMessage(error: unknown): string {
  if (isStartChatError(error)) return MESSAGE_BY_START_CHAT_KIND[error.detail.kind]
  if (isApiError(error)) return MESSAGE_BY_API_KIND[error.detail.kind] ?? FALLBACK_MESSAGE
  return FALLBACK_MESSAGE
}
