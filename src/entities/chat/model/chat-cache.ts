import type { QueryClient } from "@tanstack/react-query"
import { chatQueryKeys } from "../api/chat-queries"
import {
  addEmptyChat,
  applyMessageToChats,
  applyStatusToChats,
  confirmMessage,
  confirmMessageInChats,
  markChatRead,
  setMessageStatus,
  upsertMessage
} from "../lib/messages"
import type { TChatPreview, TMessage, TMessageStatus } from "./types"

/**
 * Запись событий в кэш TanStack Query. Если история чата ещё не загружена, её не создаём:
 * при открытии она придёт с сервера уже с этим сообщением. Список чатов так же — только
 * если он уже есть.
 */

const updateHistory = (
  queryClient: QueryClient,
  chatId: string,
  update: (messages: readonly TMessage[]) => TMessage[]
) =>
  queryClient.setQueryData(chatQueryKeys.history(chatId), (messages?: TMessage[]) =>
    messages ? update(messages) : messages
  )

const updateList = (
  queryClient: QueryClient,
  update: (chats: readonly TChatPreview[]) => TChatPreview[]
) =>
  queryClient.setQueryData(chatQueryKeys.list(), (chats?: TChatPreview[]) =>
    chats ? update(chats) : chats
  )

export const chatCache = {
  /** Новое или повторное сообщение: лента, превью и счётчик непрочитанных */
  addMessage: (
    queryClient: QueryClient,
    message: TMessage,
    options: { name?: string | null; unread: boolean }
  ) => {
    updateHistory(queryClient, message.chatId, (messages) => upsertMessage(messages, message))
    updateList(queryClient, (chats) => applyMessageToChats(chats, message, options))
  },

  setStatus: (queryClient: QueryClient, chatId: string, id: string, status: TMessageStatus) => {
    updateHistory(queryClient, chatId, (messages) => setMessageStatus(messages, id, status))
    updateList(queryClient, (chats) => applyStatusToChats(chats, chatId, id, status))
  },

  /** Ответ sendMessage: временный id → серверный */
  confirm: (queryClient: QueryClient, chatId: string, localId: string, serverId: string) => {
    updateHistory(queryClient, chatId, (messages) => confirmMessage(messages, localId, serverId))
    updateList(queryClient, (chats) => confirmMessageInChats(chats, chatId, localId, serverId))
  },

  /** Чат из поиска по номеру: появляется в списке даже без сообщений */
  addChat: (queryClient: QueryClient, chatId: string) =>
    updateList(queryClient, (chats) => addEmptyChat(chats, chatId)),

  markRead: (queryClient: QueryClient, chatId: string) =>
    updateList(queryClient, (chats) => markChatRead(chats, chatId))
}
