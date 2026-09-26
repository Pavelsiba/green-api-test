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
  webhookSchema
} from "./schemas"
import { validate } from "./validate"

/**
 * Запись, не прошедшая схему, становится `unknown`, а не ошибкой всего списка:
 * одно странное сообщение не должно прятать историю чата.
 */
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

const JOURNAL_DAY_MINUTES = 1440

type TCheckWhatsappResult = { exists: true; chatId: string } | { exists: false }

/**
 * Транспорт GREEN-API: методы без знания о кэше. Ключи и `queryOptions`
 * живут в слайсах, которым принадлежат данные (`features/*\/api/*-queries.ts`).
 */
export const greenApi = {
  /** `auth` — проверить креды до сохранения, на экране входа */
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

  /** Ключ чата — `phoneNumber` (`@c.us`), а не `chatId` (`@lid`): все вебхуки приходят с `@c.us`. */
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

  /** Последние сообщения чата, от новых к старым (так отдаёт сервер) */
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

  /** Входящие за `minutes` (по умолчанию сутки), включая группы */
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

  /** Исходящие за `minutes` (по умолчанию сутки): и с телефона, и через API */
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

  /**
   * `null` — очередь пуста. Это long-polling: пустой ответ сервер держит ~5 с (receiveTimeout),
   * параллельный второй запрос висит ~10 с и получает 408 — опрашивать строго по одному.
   * Тело, не прошедшее схему, становится `unknown`, а не исключением:
   * вызывающий обязан его удалить, иначе очередь вернёт его снова.
   */
  receiveNotification: async (signal?: AbortSignal): Promise<TNotification | null> => {
    const envelope = await greenApiInstance("receiveNotification", {
      schema: notificationEnvelopeSchema,
      signal,
      allowEmpty: true
    })
    if (!envelope) return null

    const body = validate(webhookSchema, envelope.body, `webhook ${envelope.body.typeWebhook}`)
    if (!body.ok) console.warn(`${body.reason}\n(notification will be deleted)`)
    return {
      receiptId: envelope.receiptId,
      body: body.ok
        ? body.data
        : { typeWebhook: "unknown", original: envelope.body.typeWebhook, reason: body.reason }
    }
  },

  /** `false` — уведомление уже удалено; безопасно игнорировать. */
  deleteNotification: async (receiptId: number) => {
    const data = await greenApiInstance("deleteNotification", {
      schema: deleteNotificationResponseSchema,
      method: "DELETE",
      path: `/${receiptId}`
    })
    return data.result
  }
}
