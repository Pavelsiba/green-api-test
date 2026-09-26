import type { TOutgoingMessageStatus } from "@/shared/api"

/** `sending` — локальное оптимистичное сообщение, сервер ещё не вернул idMessage */
export type TMessageStatus = TOutgoingMessageStatus | "sending"

export type TMessageContent =
  | { type: "text"; text: string }
  | { type: "unsupported"; typeMessage: string }

export type TMessage = {
  /** idMessage сервера или временный `local-*` у оптимистичного сообщения */
  id: string
  chatId: string
  direction: "incoming" | "outgoing"
  /** Unix-секунды */
  timestamp: number
  content: TMessageContent
  /** Только у исходящих */
  status?: TMessageStatus
}

export type TChatPreview = {
  /** `79001234567@c.us` */
  chatId: string
  /** Имя из контактов или профиля WhatsApp; `null` — показываем номер */
  name: string | null
  lastMessage: TMessage | null
  unreadCount: number
}
