import { type QueryClient, queryOptions } from "@tanstack/react-query"
import { greenApi } from "@/shared/api"
import { getPollInterval } from "../lib/get-poll-interval"
import { applyNotification } from "../model/apply-notification"

const notificationQueryKeys = {
  all: ["notifications"] as const,
  next: () => [...notificationQueryKeys.all, "next"] as const
}

type TPollingContext = {
  queryClient: QueryClient
  getSelectedChatId: () => string | null
}

/**
 * Одна итерация очереди уведомлений: взять → применить к кэшу чатов → удалить.
 * Удаляем и то, что не смогли разобрать, иначе очередь встанет. Если удаление упало,
 * ретрай получит то же уведомление снова — применение идемпотентно по idMessage.
 *
 * Жизненный цикл отдаём TanStack Query: интервал не запускает второй запрос, пока идёт первый
 * (параллельный long-poll сервер держит 10 с и отвечает 408), запрос отменяется при
 * размонтировании, без сети опрос на паузе, временные сбои ретраятся по правилам `queryClient`.
 * Открытый чат читается в момент применения: за время long-poll он мог смениться.
 * Данные запроса — receiptId последнего уведомления, сами по себе не нужны.
 */
export const notificationPollingQueryOptions = ({
  queryClient,
  getSelectedChatId
}: TPollingContext) =>
  queryOptions({
    queryKey: notificationQueryKeys.next(),
    queryFn: async ({ signal }) => {
      const notification = await greenApi.receiveNotification(signal)
      if (!notification) return null
      applyNotification(notification.body, {
        queryClient,
        selectedChatId: getSelectedChatId()
      })
      await greenApi.deleteNotification(notification.receiptId)
      return notification.receiptId
    },
    refetchInterval: (query) => getPollInterval(query.state.error),
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0
  })
