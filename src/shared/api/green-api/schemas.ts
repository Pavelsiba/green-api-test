import * as z from "zod/mini"

/**
 * Рантайм-контракты ответов GREEN-API. Объекты strict: перечислены все поля,
 * виденные в живых ответах 2026-09-25. Лишнее поле — сигнал дрейфа (см. `validate`).
 * Единственное осознанное исключение — `unsupportedMessageDataSchema`: медиа вне скоупа.
 */

/** Креды инстанса из личного кабинета GREEN-API */
export type TCredentials = {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

const chatIdSchema = z
  .string()
  .check(
    z.describe(
      "Ключ личного чата. Вебхуки всегда несут @c.us, даже если checkWhatsapp.chatId — @lid"
    ),
    z.endsWith("@c.us")
  )

const idMessageSchema = z
  .string()
  .check(
    z.describe("Один и тот же id в ответе sendMessage, исходящих вебхуках и статусах"),
    z.minLength(1)
  )

const timestampSchema = z.number().check(z.describe("Unix-секунды, по часам телефона"))

const stateInstanceSchema = z
  .string()
  .check(
    z.describe(
      "notAuthorized | authorized | blocked | starting | suspended | …; незнакомые значения пропускаем, пускает только authorized"
    )
  )

// ─── методы ───────────────────────────────────────────────────────────────

export const stateInstanceResponseSchema = z.strictObject({
  stateInstance: stateInstanceSchema
})

export const checkWhatsappResponseSchema = z.discriminatedUnion("existsWhatsapp", [
  z.strictObject({
    existsWhatsapp: z.literal(true),
    chatId: z.string().check(z.describe("Форма @lid: вебхуки её не используют, не хранить")),
    phoneNumber: chatIdSchema.check(z.describe("Ключ чата для хранения: @c.us")),
    username: z.string(),
    fromCache: z.boolean()
  }),
  z.strictObject({
    existsWhatsapp: z.literal(false),
    chatId: z.literal(""),
    phoneNumber: z.literal(""),
    username: z.string(),
    fromCache: z.boolean()
  })
])

export const sendMessageResponseSchema = z.strictObject({
  idMessage: idMessageSchema
})

export const deleteNotificationResponseSchema = z.strictObject({
  result: z.boolean().check(z.describe("false — уведомление уже удалено; это не ошибка")),
  reason: z
    .string()
    .check(z.describe('Пусто при успехе, "Message receiptId = N not found" при повторе'))
})

// ─── вебхуки ──────────────────────────────────────────────────────────────

const textMessageDataSchema = z.strictObject({
  typeMessage: z.literal("textMessage"),
  textMessageData: z.strictObject({ textMessage: z.string() })
})

const extendedTextMessageDataSchema = z.strictObject({
  typeMessage: z.literal("extendedTextMessage"),
  extendedTextMessageData: z.strictObject({
    text: z
      .string()
      .check(z.describe("Сюда кладётся текст, отправленный через API или со ссылкой")),
    description: z.optional(z.string()),
    title: z.optional(z.string()),
    previewType: z.optional(z.string()),
    jpegThumbnail: z.optional(z.string()),
    forwardingScore: z.optional(z.number()),
    isForwarded: z.optional(z.boolean())
  })
})

const TEXT_MESSAGE_TYPES: readonly string[] = ["textMessage", "extendedTextMessage"]

/**
 * Нестрогая намеренно: у медиа, опросов и реакций свои поля, которые мы не моделируем.
 * Текстовые типы исключены — иначе кривое текстовое сообщение молча
 * показалось бы «неподдерживаемым» вместо сигнала о дрейфе.
 */
const unsupportedMessageDataSchema = z.looseObject({
  typeMessage: z.string().check(
    z.describe("Медиа, опросы, реакции: вне скоупа, показываются как неподдерживаемые"),
    z.refine((typeMessage) => !TEXT_MESSAGE_TYPES.includes(typeMessage))
  )
})

const messageDataSchema = z.union([
  textMessageDataSchema,
  extendedTextMessageDataSchema,
  unsupportedMessageDataSchema
])

const instanceDataSchema = z.strictObject({
  idInstance: z.number(),
  wid: z.string(),
  typeInstance: z.string()
})

const senderDataSchema = z.strictObject({
  chatId: chatIdSchema,
  sender: z.string(),
  senderName: z.string(),
  senderContactName: z.optional(z.string()),
  chatName: z.optional(z.string())
})

const messageWebhookShape = {
  idMessage: idMessageSchema,
  timestamp: timestampSchema,
  instanceData: instanceDataSchema,
  senderData: senderDataSchema,
  messageData: messageDataSchema
}

export const webhookSchema = z.discriminatedUnion("typeWebhook", [
  z.strictObject({
    typeWebhook: z.literal("incomingMessageReceived"),
    ...messageWebhookShape
  }),
  z.strictObject({
    typeWebhook: z
      .literal("outgoingMessageReceived")
      .check(z.describe("Отправлено с телефона, не через API")),
    ...messageWebhookShape
  }),
  z.strictObject({
    typeWebhook: z
      .literal("outgoingAPIMessageReceived")
      .check(
        z.describe(
          "Отправлено через API: дубль нашего оптимистичного сообщения, дедуп по idMessage"
        )
      ),
    ...messageWebhookShape
  }),
  z.strictObject({
    typeWebhook: z.literal("outgoingMessageStatus"),
    chatId: chatIdSchema,
    idMessage: idMessageSchema,
    timestamp: timestampSchema,
    instanceData: instanceDataSchema,
    status: z.enum(["pending", "sent", "delivered", "read", "failed", "noAccount", "notInGroup"]),
    sendByApi: z.boolean()
  }),
  z.strictObject({
    typeWebhook: z
      .literal("stateInstanceChanged")
      .check(z.describe("Вживую ещё не видели: форма взята из документации")),
    stateInstance: stateInstanceSchema,
    timestamp: timestampSchema,
    instanceData: instanceDataSchema
  })
])

/**
 * `receiptId` проверяется жёстко: без него уведомление не удалить.
 * От `body` здесь нужен только `typeWebhook`; полная проверка — в `greenApi.receiveNotification`,
 * чтобы непрошедшее тело всё равно удалялось, а не блокировало очередь.
 */
export const notificationEnvelopeSchema = z.strictObject({
  receiptId: z.number(),
  body: z.looseObject({ typeWebhook: z.string() })
})

export type TInstanceState = z.infer<typeof stateInstanceSchema>
export type TCheckWhatsappResponse = z.infer<typeof checkWhatsappResponseSchema>
export type TSendMessageResponse = z.infer<typeof sendMessageResponseSchema>
export type TMessageData = z.infer<typeof messageDataSchema>
export type TWebhook = z.infer<typeof webhookSchema>
export type TOutgoingMessageStatus = Extract<
  TWebhook,
  { typeWebhook: "outgoingMessageStatus" }
>["status"]

/**
 * Вебхук, который мы не включали или не смогли разобрать. Опрос обязан его удалить,
 * иначе `receiveNotification` будет отдавать его вечно и очередь встанет.
 */
export type TUnknownWebhook = { typeWebhook: "unknown"; original: string; reason: string }

export type TNotification = { receiptId: number; body: TWebhook | TUnknownWebhook }
