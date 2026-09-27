import { queryOptions } from "@tanstack/react-query"
import { greenApi } from "@/shared/api"
import { buildChatList } from "../lib/build-chat-list"
import { journalToMessage } from "../lib/to-message"

/**
 * Запросы чата — хранилище сообщений. Список собирается из журнала за неделю, история —
 * последние 100 сообщений, от старых к новым (сервер отдаёт наоборот). После первой загрузки
 * данные меняются только через `chatCache`, поэтому `staleTime: Infinity` и без перезапросов
 * по фокусу. idInstance в ключах не нужен: при выходе кэш сбрасывается целиком.
 */
export const chatQueryKeys = {
  all: ["chat"] as const,
  list: () => [...chatQueryKeys.all, "list"] as const,
  history: (chatId: string) => [...chatQueryKeys.all, chatId, "history"] as const
}

const CHAT_LIST_MINUTES = 7 * 24 * 60

const HISTORY_COUNT = 100

export const chatListQueryOptions = () =>
  queryOptions({
    queryKey: chatQueryKeys.list(),
    queryFn: async () => {
      const [incoming, outgoing] = await Promise.all([
        greenApi.lastIncomingMessages({ minutes: CHAT_LIST_MINUTES }),
        greenApi.lastOutgoingMessages({ minutes: CHAT_LIST_MINUTES })
      ])
      return buildChatList([...incoming, ...outgoing])
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false
  })

export const chatHistoryQueryOptions = (chatId: string) =>
  queryOptions({
    queryKey: chatQueryKeys.history(chatId),
    queryFn: async () => {
      const journal = await greenApi.getChatHistory({ chatId, count: HISTORY_COUNT })
      return journal.map(journalToMessage).sort((left, right) => left.timestamp - right.timestamp)
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false
  })
