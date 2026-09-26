import {
  isJournalTextMessage,
  isTextMessageData,
  type TJournalMessage,
  type TMessageData,
  type TWebhook
} from "@/shared/api"
import type { TMessage, TMessageContent } from "../model/types"

type TMessageWebhook = Extract<
  TWebhook,
  {
    typeWebhook:
      | "incomingMessageReceived"
      | "outgoingMessageReceived"
      | "outgoingAPIMessageReceived"
  }
>

const getWebhookContent = (data: TMessageData): TMessageContent => {
  if (!isTextMessageData(data)) return { type: "unsupported", typeMessage: data.typeMessage }
  const text =
    data.typeMessage === "textMessage"
      ? data.textMessageData.textMessage
      : data.extendedTextMessageData.text
  return { type: "text", text }
}

/** Запись журнала (история, последние сообщения) → сообщение чата */
export function journalToMessage(message: TJournalMessage): TMessage {
  const content: TMessageContent = isJournalTextMessage(message)
    ? { type: "text", text: message.textMessage }
    : { type: "unsupported", typeMessage: message.typeMessage }

  return {
    id: message.idMessage,
    chatId: message.chatId,
    direction: message.type,
    timestamp: message.timestamp,
    content,
    status:
      isJournalTextMessage(message) && message.type === "outgoing"
        ? message.statusMessage
        : undefined
  }
}

/**
 * Вебхук сообщения → сообщение чата. Статус исходящего с телефона или через API
 * на момент вебхука — `sent`: дальше его двигают вебхуки `outgoingMessageStatus`.
 */
export function webhookToMessage(webhook: TMessageWebhook): TMessage {
  const isIncoming = webhook.typeWebhook === "incomingMessageReceived"
  return {
    id: webhook.idMessage,
    chatId: webhook.senderData.chatId,
    direction: isIncoming ? "incoming" : "outgoing",
    timestamp: webhook.timestamp,
    content: getWebhookContent(webhook.messageData),
    status: isIncoming ? undefined : "sent"
  }
}

export type { TMessageWebhook }
