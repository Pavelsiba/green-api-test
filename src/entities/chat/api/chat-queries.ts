import { queryOptions } from "@tanstack/react-query"
import { greenApi } from "@/shared/api"
import { buildChatList } from "../lib/build-chat-list"
import { journalToMessage } from "../lib/to-message"

/** Кэш сбрасывается целиком при выходе, поэтому idInstance в ключах не нужен */
export const chatQueryKeys = {
  all: ["chat"] as const,
  list: () => [...chatQueryKeys.all, "list"] as const,
  history: (chatId: string) => [...chatQueryKeys.all, chatId, "history"] as const
}

/** Окно журнала для списка чатов: неделя */
const CHAT_LIST_MINUTES = 7 * 24 * 60

/** Столько сообщений подгружаем при открытии чата */
const HISTORY_COUNT = 100

/**
 * Данные после первой загрузки живут за счёт вебхуков (`features/receive-messages`),
 * поэтому перезапросы по фокусу и устареванию выключены: они затёрли бы непрочитанные.
 *
 * `signal` в запросы намеренно не передаём: тогда TanStack Query не отменяет запрос при
 * размонтировании, а переиспользует его при повторном монтировании (быстрое
 * переключение чатов). Отменённый запрос сервер всё равно считает, и следующий ловит 429.
 */
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

/** Сервер отдаёт историю от новых к старым; лента хранит от старых к новым */
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
