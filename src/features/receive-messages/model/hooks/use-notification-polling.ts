import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useStore } from "jotai"
import { selectedChatIdAtom } from "@/entities/chat"
import { notificationPollingQueryOptions } from "../../api/notification-queries"

/** Приём сообщений, пока смонтирован экран чата. Вся механика — в `notificationPollingQueryOptions` */
export function useNotificationPolling() {
  const queryClient = useQueryClient()
  const store = useStore()

  useQuery(
    notificationPollingQueryOptions({
      queryClient,
      getSelectedChatId: () => store.get(selectedChatIdAtom)
    })
  )
}
