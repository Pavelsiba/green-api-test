import type { TJournalMessage } from "@/shared/api"
import type { TChatPreview } from "../model/types"
import { sortChats } from "./messages"
import { journalToMessage } from "./to-message"

const PERSONAL_CHAT_SUFFIX = "@c.us"

/** Поле нестрогой записи журнала (медиа и т.п.), если оно строка/булево нужного вида */
const readString = (message: TJournalMessage, key: string): string | null => {
  const value: unknown = (message as Record<string, unknown>)[key]
  return typeof value === "string" && value !== "" ? value : null
}

/** Имя собеседника есть только во входящих: сначала из контактов телефона, потом из профиля */
const getSenderName = (message: TJournalMessage) =>
  message.type === "incoming"
    ? (readString(message, "senderContactName") ?? readString(message, "senderName"))
    : null

const isUnread = (message: TJournalMessage) =>
  message.type === "incoming" && (message as Record<string, unknown>).isRead === false

/**
 * Список чатов из последних входящих и исходящих. Отдельного метода «чаты с последним
 * сообщением» у GREEN-API нет: getChats отдаёт сотни чатов без времени. Группы отбрасываем —
 * чат только личный.
 */
export function buildChatList(journal: readonly TJournalMessage[]): TChatPreview[] {
  const chats = new Map<string, TChatPreview>()

  for (const entry of journal) {
    if (!entry.chatId.endsWith(PERSONAL_CHAT_SUFFIX)) continue
    const message = journalToMessage(entry)
    const chat = chats.get(entry.chatId) ?? {
      chatId: entry.chatId,
      name: null,
      lastMessage: null,
      unreadCount: 0
    }
    chats.set(entry.chatId, {
      ...chat,
      name: chat.name ?? getSenderName(entry),
      lastMessage:
        !chat.lastMessage || chat.lastMessage.timestamp < message.timestamp
          ? message
          : chat.lastMessage,
      unreadCount: chat.unreadCount + (isUnread(entry) ? 1 : 0)
    })
  }

  return sortChats([...chats.values()])
}
