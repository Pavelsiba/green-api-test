import type { TJournalMessage } from "@/shared/api"
import type { TChatPreview } from "../model/types"
import { sortChats } from "./messages"
import { journalToMessage } from "./to-message"

const PERSONAL_CHAT_SUFFIX = "@c.us"

const toName = (value: unknown) => (typeof value === "string" && value !== "" ? value : null)

const getSenderName = (message: TJournalMessage) => {
  if (message.type !== "incoming") return null
  const contactName = "senderContactName" in message ? toName(message.senderContactName) : null
  return contactName ?? ("senderName" in message ? toName(message.senderName) : null)
}

const isUnread = (message: TJournalMessage) =>
  message.type === "incoming" && "isRead" in message && message.isRead === false

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
