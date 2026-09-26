import { ApiError, type TApiErrorKind } from "@/shared/api"

/** Номер валиден, но WhatsApp на нём нет */
export class NoWhatsappError extends Error {
  constructor() {
    super("Phone has no WhatsApp account")
    this.name = "NoWhatsappError"
  }
}

// Одна строка слота ошибки под полем на ширине сайдбара
const MESSAGE_BY_KIND: Partial<Record<TApiErrorKind["kind"], string>> = {
  contactLimit: "Лимит проверок номеров исчерпан, попробуйте через 2 часа",
  network: "Нет связи с сервером",
  rateLimited: "Слишком часто, подождите секунду",
  validation: "Сервер не принял номер"
}

export function getStartChatErrorMessage(error: unknown): string {
  if (error instanceof NoWhatsappError) return "Этот номер не зарегистрирован в WhatsApp"
  if (error instanceof ApiError) {
    return MESSAGE_BY_KIND[error.error.kind] ?? "Не удалось проверить номер"
  }
  return "Не удалось проверить номер"
}
