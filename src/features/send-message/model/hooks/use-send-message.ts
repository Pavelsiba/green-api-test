import { useMutation, useQueryClient } from "@tanstack/react-query"
import { chatCache } from "@/entities/chat"
import { greenApi } from "@/shared/api"

type TSendVariables = { chatId: string; text: string; localId: string }

/**
 * Отправка с оптимистичным пузырём: сразу `sending` с временным id, после ответа —
 * серверный idMessage и `sent`, при ошибке — `failed`. Дальше статус двигают вебхуки.
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  const { mutate } = useMutation({
    mutationFn: ({ chatId, text }: TSendVariables) =>
      greenApi.sendMessage({ chatId, message: text }),
    onMutate: ({ chatId, text, localId }) =>
      chatCache.addMessage(
        queryClient,
        {
          id: localId,
          chatId,
          direction: "outgoing",
          timestamp: Math.floor(Date.now() / 1000),
          content: { type: "text", text },
          status: "sending"
        },
        { unread: false }
      ),
    onSuccess: ({ idMessage }, { chatId, localId }) =>
      chatCache.confirm(queryClient, chatId, localId, idMessage),
    onError: (error, { chatId, localId }) => {
      console.warn("Message was not sent", error)
      chatCache.setStatus(queryClient, chatId, localId, "failed")
    }
  })

  const send = (chatId: string, text: string) =>
    mutate({ chatId, text, localId: `local-${crypto.randomUUID()}` })

  return { send }
}
