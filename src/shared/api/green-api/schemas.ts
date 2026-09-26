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

const outgoingStatusSchema = z.enum([
  "pending",
  "sent",
  "delivered",
  "read",
  "failed",
  "noAccount",
  "notInGroup"
])

const textMessageDataSchema = z.strictObject({
  typeMessage: z.literal("textMessage"),
  textMessageData: z.strictObject({ textMessage: z.string() })
})

/** Одинаков в вебхуке (`extendedTextMessageData`) и в журнале (`extendedTextMessage`) */
const extendedTextSchema = z.strictObject({
  text: z.string().check(z.describe("Сюда кладётся текст, отправленный через API или со ссылкой")),
  description: z.optional(z.string()),
  title: z.optional(z.string()),
  previewType: z.optional(z.string()),
  jpegThumbnail: z.optional(z.string()),
  forwardingScore: z.optional(z.number()),
  isForwarded: z.optional(z.boolean())
})

const extendedTextMessageDataSchema = z.strictObject({
  typeMessage: z.literal("extendedTextMessage"),
  extendedTextMessageData: extendedTextSchema
})

const TEXT_MESSAGE_TYPES: readonly string[] = ["textMessage", "extendedTextMessage"]

const isNotTextType = (typeMessage: string) => !TEXT_MESSAGE_TYPES.includes(typeMessage)

/**
 * Нестрогая намеренно: у медиа, опросов и реакций свои поля, которые мы не моделируем.
 * Текстовые типы исключены — иначе кривое текстовое сообщение молча
 * показалось бы «неподдерживаемым» вместо сигнала о дрейфе.
 */
const unsupportedMessageDataSchema = z.looseObject({
  typeMessage: z
    .string()
    .check(
      z.describe("Медиа, опросы, реакции: вне скоупа, показываются как неподдерживаемые"),
      z.refine(isNotTextType)
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
    status: outgoingStatusSchema,
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

// ─── журнал сообщений: getChatHistory, lastIncomingMessages, lastOutgoingMessages ───

/**
 * Поля записи журнала плоские, в отличие от вебхука. Формы сняты с живых ответов 2026-09-26.
 * Входящий extendedTextMessage в журнале вживую не видели: если придёт в другой форме,
 * запись станет `unknown` с предупреждением о дрейфе, а не уронит весь список.
 */
const journalBaseShape = {
  idMessage: idMessageSchema,
  timestamp: timestampSchema,
  chatId: z
    .string()
    .check(z.describe("@c.us — личный чат, @g.us — группа: журнал отдаёт и группы")),
  deletedMessageId: z.string(),
  editedMessageId: z.string(),
  isEdited: z.boolean(),
  isDeleted: z.boolean()
}

const journalIncomingShape = {
  ...journalBaseShape,
  type: z.literal("incoming"),
  senderId: z.string(),
  senderName: z.string(),
  senderContactName: z.string(),
  isRead: z.optional(z.boolean()),
  isReadTimestamp: z.optional(z.number())
}

const journalOutgoingShape = {
  ...journalBaseShape,
  type: z.literal("outgoing"),
  statusMessage: outgoingStatusSchema,
  sendByApi: z.boolean().check(z.describe("false — отправлено с телефона"))
}

const journalTextShape = {
  typeMessage: z.literal("textMessage"),
  textMessage: z.string()
}

const journalExtendedTextShape = {
  typeMessage: z.literal("extendedTextMessage"),
  textMessage: z.string().check(z.describe("Дублирует extendedTextMessage.text")),
  extendedTextMessage: extendedTextSchema
}

const journalTextMessageSchema = z.union([
  z.strictObject({ ...journalIncomingShape, ...journalTextShape }),
  z.strictObject({ ...journalIncomingShape, ...journalExtendedTextShape }),
  z.strictObject({ ...journalOutgoingShape, ...journalTextShape }),
  z.strictObject({ ...journalOutgoingShape, ...journalExtendedTextShape })
])

/** Минимум, без которого запись не показать; всё остальное проверяет `journalMessageSchema` */
export const journalEnvelopeSchema = z.array(
  z.looseObject({
    type: z.enum(["incoming", "outgoing"]),
    idMessage: idMessageSchema,
    timestamp: timestampSchema,
    chatId: z.string(),
    typeMessage: z.string()
  })
)

/** Медиа, реакции и прочее вне скоупа: нестрогая, как `unsupportedMessageDataSchema` */
const journalUnsupportedMessageSchema = z.looseObject({
  type: z.enum(["incoming", "outgoing"]),
  idMessage: idMessageSchema,
  timestamp: timestampSchema,
  chatId: z.string(),
  typeMessage: z.string().check(z.refine(isNotTextType))
})

export const journalMessageSchema = z.union([
  journalTextMessageSchema,
  journalUnsupportedMessageSchema
])

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

export type TJournalEnvelope = z.infer<typeof journalEnvelopeSchema>[number]
export type TJournalTextMessage = z.infer<typeof journalTextMessageSchema>

/** Запись журнала, не прошедшая схему: показывается как неподдерживаемая, дрейф уже залогирован */
type TUnknownJournalMessage = {
  type: TJournalEnvelope["type"]
  idMessage: string
  timestamp: number
  chatId: string
  typeMessage: "unknown"
  original: string
}

export type TJournalMessage = z.infer<typeof journalMessageSchema> | TUnknownJournalMessage

type TTextMessageData = z.infer<typeof textMessageDataSchema | typeof extendedTextMessageDataSchema>

/**
 * У нестрогих веток `typeMessage: string`, поэтому сравнение с литералом тип не сужает.
 * Guard надёжен: схемы запрещают нестрогим веткам текстовые `typeMessage`.
 */
export const isTextMessageData = (data: TMessageData): data is TTextMessageData =>
  TEXT_MESSAGE_TYPES.includes(data.typeMessage)

export const isJournalTextMessage = (message: TJournalMessage): message is TJournalTextMessage =>
  TEXT_MESSAGE_TYPES.includes(message.typeMessage)
