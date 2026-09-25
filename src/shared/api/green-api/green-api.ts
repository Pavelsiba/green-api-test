import { greenApiInstance } from "./api-instance"
import {
  checkWhatsappResponseSchema,
  deleteNotificationResponseSchema,
  notificationEnvelopeSchema,
  sendMessageResponseSchema,
  stateInstanceResponseSchema,
  type TCredentials,
  type TNotification,
  webhookSchema
} from "./schemas"
import { validate } from "./validate"

export type TCheckWhatsappResult = { exists: true; chatId: string } | { exists: false }

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

  /**
   * `null` — очередь пуста. Сервер отвечает сразу, long-polling нет.
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
