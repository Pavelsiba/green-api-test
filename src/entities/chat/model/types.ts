import type { TOutgoingMessageStatus } from "@/shared/api"

/**
 * Модель чата. `sending` — оптимистичное сообщение с временным id `local-*`, сервер ещё
 * не вернул idMessage. `timestamp` — Unix-секунды, `status` есть только у исходящих,
 * `name` чата — из контактов или профиля WhatsApp, `null` — показываем номер.
 */
export type TMessageStatus = TOutgoingMessageStatus | "sending"

export type TMessageContent =
  | { type: "text"; text: string }
  | { type: "unsupported"; typeMessage: string }

export type TMessage = {
  id: string
  chatId: string
  direction: "incoming" | "outgoing"
  timestamp: number
  content: TMessageContent
  status?: TMessageStatus
}

export type TChatPreview = {
  chatId: string
  name: string | null
  lastMessage: TMessage | null
  unreadCount: number
}
