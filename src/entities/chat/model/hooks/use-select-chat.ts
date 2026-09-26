import { useQueryClient } from "@tanstack/react-query"
import { useSetAtom } from "jotai"
import { chatCache } from "../chat-cache"
import { selectedChatIdAtom } from "../selected-chat-atom"

/** Открывает чат и сбрасывает его непрочитанные; `null` — вернуться к списку */
export function useSelectChat() {
  const queryClient = useQueryClient()
  const setSelectedChatId = useSetAtom(selectedChatIdAtom)

  return (chatId: string | null) => {
    setSelectedChatId(chatId)
    if (chatId) chatCache.markRead(queryClient, chatId)
  }
}
