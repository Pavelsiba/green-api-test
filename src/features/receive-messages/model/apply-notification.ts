import type { QueryClient } from "@tanstack/react-query"
import { chatCache, type TMessageWebhook, webhookToMessage } from "@/entities/chat"
import type { TUnknownWebhook, TWebhook } from "@/shared/api"

type TNotificationContext = {
  queryClient: QueryClient
  /** Открытый чат: входящие в него не считаются непрочитанными */
  selectedChatId: string | null
}

type TWebhookHandlers = {
  [TType in TWebhook["typeWebhook"]]: (
    webhook: Extract<TWebhook, { typeWebhook: TType }>,
    context: TNotificationContext
  ) => void
}

/** Исходящее с телефона или через API: имени собеседника в нём нет, кроме `chatName` */
const applyOutgoing = (webhook: TMessageWebhook, { queryClient }: TNotificationContext) =>
  chatCache.addMessage(queryClient, webhookToMessage(webhook), {
    name: webhook.senderData.chatName,
    unread: false
  })

const WEBHOOK_HANDLERS: TWebhookHandlers = {
  incomingMessageReceived: (webhook, { queryClient, selectedChatId }) => {
    const { chatId, senderContactName, senderName } = webhook.senderData
    chatCache.addMessage(queryClient, webhookToMessage(webhook), {
      name: senderContactName || senderName,
      unread: chatId !== selectedChatId
    })
  },
  outgoingMessageReceived: applyOutgoing,
  // дубль нашего же sendMessage: upsert по idMessage не даст второго пузыря
  outgoingAPIMessageReceived: applyOutgoing,
  outgoingMessageStatus: ({ chatId, idMessage, status }, { queryClient }) =>
    chatCache.setStatus(queryClient, chatId, idMessage, status),
  stateInstanceChanged: ({ stateInstance }) =>
    console.warn(`Instance state changed: ${stateInstance}`)
}

/**
 * Применяет уведомление к кэшу чатов. Неразобранный вебхук (`unknown`) уже залогирован
 * транспортом — здесь его просто пропускаем, удалит его цикл опроса.
 */
export function applyNotification(
  body: TWebhook | TUnknownWebhook,
  context: TNotificationContext
): void {
  if (body.typeWebhook === "unknown") return
  const handler = WEBHOOK_HANDLERS[body.typeWebhook] as (
    webhook: TWebhook,
    context: TNotificationContext
  ) => void
  handler(body, context)
}
