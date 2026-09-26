import type { TChatPreview, TMessage, TMessageStatus } from "../model/types"

/**
 * Чистые операции над лентой и списком чатов. Одно и то же событие может прийти дважды
 * (вебхук повторился, ответ sendMessage и `outgoingAPIMessageReceived`), поэтому все они
 * идемпотентны по id сообщения.
 */

const byTimestamp = (left: TMessage, right: TMessage) => left.timestamp - right.timestamp

/** Добавляет сообщение по времени; повтор с тем же id заменяет старое, статус не откатывается назад */
export function upsertMessage(messages: readonly TMessage[], message: TMessage): TMessage[] {
  const existing = messages.find((item) => item.id === message.id)
  if (!existing) return [...messages, message].sort(byTimestamp)
  const merged = { ...message, status: pickLaterStatus(existing.status, message.status) }
  return messages.map((item) => (item.id === message.id ? merged : item))
}

/**
 * Оптимистичное сообщение получило настоящий id. Если вебхук с этим id уже успел
 * добавить копию, локальная удаляется, чтобы не было дубля.
 */
export function confirmMessage(
  messages: readonly TMessage[],
  localId: string,
  serverId: string
): TMessage[] {
  if (messages.some((item) => item.id === serverId)) {
    return messages.filter((item) => item.id !== localId)
  }
  return messages.map((item) =>
    item.id === localId
      ? { ...item, id: serverId, status: pickLaterStatus(item.status, "sent") }
      : item
  )
}

export const setMessageStatus = (
  messages: readonly TMessage[],
  id: string,
  status: TMessageStatus
): TMessage[] =>
  messages.map((item) =>
    item.id === id ? { ...item, status: pickLaterStatus(item.status, status) } : item
  )

/** Порядок жизни исходящего; «ошибочные» статусы финальны и перекрывают всё */
const STATUS_RANK: Record<TMessageStatus, number> = {
  sending: 0,
  pending: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  failed: 5,
  noAccount: 5,
  notInGroup: 5
}

/** Вебхуки статусов приходят не по порядку: `delivered` после `read` не должен откатить галочки */
function pickLaterStatus(
  current: TMessageStatus | undefined,
  next: TMessageStatus | undefined
): TMessageStatus | undefined {
  if (!current) return next
  if (!next) return current
  return STATUS_RANK[next] >= STATUS_RANK[current] ? next : current
}

const byLastMessage = (left: TChatPreview, right: TChatPreview) =>
  (right.lastMessage?.timestamp ?? Number.POSITIVE_INFINITY) -
  (left.lastMessage?.timestamp ?? Number.POSITIVE_INFINITY)

/** Сортирует чаты: новые сверху, только что созданные без сообщений — в самом верху */
export const sortChats = (chats: readonly TChatPreview[]) => [...chats].sort(byLastMessage)

/**
 * Новое сообщение в чате: обновляет превью или создаёт чат. `unread` — входящее
 * в чат, который сейчас не открыт.
 */
export function applyMessageToChats(
  chats: readonly TChatPreview[],
  message: TMessage,
  { name, unread }: { name?: string | null; unread: boolean }
): TChatPreview[] {
  const existing = chats.find((chat) => chat.chatId === message.chatId)
  const isNewer = !existing?.lastMessage || existing.lastMessage.timestamp <= message.timestamp
  const isRepeat = existing?.lastMessage?.id === message.id

  const updated: TChatPreview = {
    chatId: message.chatId,
    name: existing?.name || name || null,
    lastMessage: isNewer ? message : (existing?.lastMessage ?? null),
    unreadCount: (existing?.unreadCount ?? 0) + (unread && !isRepeat ? 1 : 0)
  }
  return sortChats([...chats.filter((chat) => chat.chatId !== message.chatId), updated])
}

/** Статус пришёл для последнего сообщения чата — обновляем его и в превью */
export const applyStatusToChats = (
  chats: readonly TChatPreview[],
  chatId: string,
  id: string,
  status: TMessageStatus
): TChatPreview[] =>
  chats.map((chat) =>
    chat.chatId === chatId && chat.lastMessage?.id === id
      ? { ...chat, lastMessage: setMessageStatus([chat.lastMessage], id, status)[0] ?? null }
      : chat
  )

/** Id оптимистичного сообщения поменялся на серверный — превью должно ссылаться на новый */
export const confirmMessageInChats = (
  chats: readonly TChatPreview[],
  chatId: string,
  localId: string,
  serverId: string
): TChatPreview[] =>
  chats.map((chat) =>
    chat.chatId === chatId && chat.lastMessage?.id === localId
      ? { ...chat, lastMessage: confirmMessage([chat.lastMessage], localId, serverId)[0] ?? null }
      : chat
  )

/** Пустой чат из поиска по номеру; существующий не трогаем */
export const addEmptyChat = (chats: readonly TChatPreview[], chatId: string): TChatPreview[] =>
  chats.some((chat) => chat.chatId === chatId)
    ? [...chats]
    : sortChats([...chats, { chatId, name: null, lastMessage: null, unreadCount: 0 }])

export const markChatRead = (chats: readonly TChatPreview[], chatId: string): TChatPreview[] =>
  chats.map((chat) => (chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat))
