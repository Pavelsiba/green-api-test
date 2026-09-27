import { useMutation, useQueryClient } from "@tanstack/react-query"
import { chatCache, chatListQueryOptions, useSelectChat } from "@/entities/chat"
import { greenApi } from "@/shared/api"
import { createNoWhatsappError } from "../../lib/get-start-chat-error-message"

/**
 * Открывает чат по номеру. Уже известный чат открывается без запроса: у checkWhatsapp
 * жёсткий лимит проверок, за превышение (469) включается антифрод.
 */
export function useStartChat({ onStarted }: { onStarted?: () => void } = {}) {
  const queryClient = useQueryClient()
  const selectChat = useSelectChat()

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: async (phone: string) => {
      const knownChatId = `${phone}@c.us`
      const chats = queryClient.getQueryData(chatListQueryOptions().queryKey)
      if (chats?.some((chat) => chat.chatId === knownChatId)) return knownChatId

      const result = await greenApi.checkWhatsapp(phone)
      if (!result.exists) throw createNoWhatsappError()
      return result.chatId
    },
    onSuccess: (chatId) => {
      chatCache.addChat(queryClient, chatId)
      selectChat(chatId)
      onStarted?.()
    }
  })

  return { startChat: mutate, isPending, error, reset }
}
