import { greenApiInstance } from "./api-instance"
import {
  checkWhatsappResponseSchema,
  deleteNotificationResponseSchema,
  journalEnvelopeSchema,
  journalMessageSchema,
  notificationEnvelopeSchema,
  sendMessageResponseSchema,
  stateInstanceResponseSchema,
  type TCredentials,
  type TJournalEnvelope,
  type TJournalMessage,
  type TNotification,
  webhookChatIdSchema,
  webhookSchema
} from "./schemas"
import { validate } from "./validate"

type TCheckWhatsappResult = { exists: true; chatId: string } | { exists: false }

const JOURNAL_DAY_MINUTES = 1440

function parseJournalMessage(envelope: TJournalEnvelope, method: string): TJournalMessage {
  const result = validate(journalMessageSchema, envelope, `${method} ${envelope.typeMessage}`)
  if (result.ok) return result.data
  console.warn(`${result.reason}
(message will be shown as unsupported)`)
  const { type, idMessage, timestamp, chatId } = envelope
  return {
    type,
    idMessage,
    timestamp,
    chatId,
    typeMessage: "unknown",
    original: envelope.typeMessage
  }
}

/**
 * Транспорт GREEN-API: методы без знания о кэше. Ключи и `queryOptions` живут в слайсах,
 * которым принадлежат данные. Ключ чата — `phoneNumber@c.us` из `checkWhatsapp`, а не `@lid`:
 * вебхуки всегда приходят с `@c.us`. `receiveNotification` — long-polling (~5 с на пустой
 * очереди, параллельный второй запрос получает 408): опрашивать строго по одному. Вебхук и запись
 * журнала, не прошедшие схему, становятся `unknown` с предупреждением, а не ошибкой.
 */
export const greenApi = {
  getStateInstance: async ({
    signal,
    auth
  }: {
    signal?: AbortSignal
    auth?: TCredentials
  } = {}) => {
    const data = await greenApiInstance("getStateInstance", {
      schema: stateInstanceResponseSchema,
      signal,
      auth
    })
    return data.stateInstance
  },

  checkWhatsapp: async (phone: string): Promise<TCheckWhatsappResult> => {
    const data = await greenApiInstance("checkWhatsapp", {
      schema: checkWhatsappResponseSchema,
      method: "POST",
      json: { phoneNumber: Number(phone) }
    })
    return data.existsWhatsapp ? { exists: true, chatId: data.phoneNumber } : { exists: false }
  },

  sendMessage: ({ chatId, message }: { chatId: string; message: string }) =>
    greenApiInstance("sendMessage", {
      schema: sendMessageResponseSchema,
      method: "POST",
      json: { chatId, message }
    }),

  getChatHistory: async ({
    chatId,
    count,
    signal
  }: {
    chatId: string
    count: number
    signal?: AbortSignal
  }) => {
    const data = await greenApiInstance("getChatHistory", {
      schema: journalEnvelopeSchema,
      method: "POST",
      json: { chatId, count },
      signal
    })
    return data.map((envelope) => parseJournalMessage(envelope, "getChatHistory"))
  },

  lastIncomingMessages: async ({
    minutes = JOURNAL_DAY_MINUTES,
    signal
  }: {
    minutes?: number
    signal?: AbortSignal
  } = {}) => {
    const data = await greenApiInstance("lastIncomingMessages", {
      schema: journalEnvelopeSchema,
      path: `?minutes=${minutes}`,
      signal
    })
    return data.map((envelope) => parseJournalMessage(envelope, "lastIncomingMessages"))
  },

  lastOutgoingMessages: async ({
    minutes = JOURNAL_DAY_MINUTES,
    signal
  }: {
    minutes?: number
    signal?: AbortSignal
  } = {}) => {
    const data = await greenApiInstance("lastOutgoingMessages", {
      schema: journalEnvelopeSchema,
      path: `?minutes=${minutes}`,
      signal
    })
    return data.map((envelope) => parseJournalMessage(envelope, "lastOutgoingMessages"))
  },

  receiveNotification: async (signal?: AbortSignal): Promise<TNotification | null> => {
    const envelope = await greenApiInstance("receiveNotification", {
      schema: notificationEnvelopeSchema,
      signal,
      allowEmpty: true
    })
    if (!envelope) return null

    const chatId = webhookChatIdSchema.safeParse(envelope.body).data
    const context = `webhook ${envelope.body.typeWebhook}${chatId ? ` ${chatId}` : ""}`
    const body = validate(webhookSchema, envelope.body, context)
    if (!body.ok) console.warn(`${body.reason}\n(notification will be deleted)`)
    return {
      receiptId: envelope.receiptId,
      body: body.ok
        ? body.data
        : { typeWebhook: "unknown", original: envelope.body.typeWebhook, reason: body.reason }
    }
  },

  deleteNotification: async (receiptId: number) => {
    const data = await greenApiInstance("deleteNotification", {
      schema: deleteNotificationResponseSchema,
      method: "DELETE",
      path: `/${receiptId}`
    })
    return data.result
  }
}
