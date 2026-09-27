import * as z from "zod/mini"

/**
 * Рантайм-контракты ответов GREEN-API. Объекты strict: перечислены все поля,
 * виденные в живых ответах 2026-09-25. Любое расхождение — поломка контракта (см. `validate`).
 * Текст приходит как `textMessage` или `extendedTextMessage` (со ссылкой, цитатой, отправленный
 * через API). Нестрогие только ветки медиа (вне скоупа), у них `typeMessage: string`, текстовый
 * `typeMessage` в них запрещён — сужать текст нужно guard-функциями `isTextMessageData` /
 * `isJournalTextMessage`. Вебхук `unknown` опрос обязан удалить, иначе очередь будет отдавать
 * его вечно. `webhookChatIdSchema` тоже нестрогая: достаёт chatId у вебхука, не прошедшего схему.
 */

const TEXT_MESSAGE_TYPES: readonly string[] = ["textMessage", "extendedTextMessage"]

const isNotTextType = (typeMessage: string) => !TEXT_MESSAGE_TYPES.includes(typeMessage)

export const isTextMessageData = (data: TMessageData): data is TTextMessageData =>
  TEXT_MESSAGE_TYPES.includes(data.typeMessage)

export const isJournalTextMessage = (message: TJournalMessage): message is TJournalTextMessage =>
  TEXT_MESSAGE_TYPES.includes(message.typeMessage)

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

export const rejectedResponseSchema = z.object({
  status: z
    .literal(false)
    .check(z.describe("Отказ GREEN-API приходит с HTTP 200, а не кодом ошибки")),
  reason: z.string()
})

export const errorBodySchema = z.object({
  message: z.string().check(z.describe("Текст ошибки в теле ответа, например 400 валидации"))
})

const outgoingStatusSchema = z.literal([
  "pending",
  "sent",
  "delivered",
  "read",
  "failed",
  "noAccount",
  "notInGroup"
])

const extendedTextSchema = z.strictObject({
  text: z.string().check(z.describe("Сюда кладётся текст, отправленный через API или со ссылкой")),
  description: z.optional(z.string()),
  title: z.optional(z.string()),
  previewType: z.optional(z.string()),
  jpegThumbnail: z.optional(z.string()),
  forwardingScore: z.optional(z.number()),
  isForwarded: z.optional(z.boolean())
})

const textMessageDataSchema = z.strictObject({
  typeMessage: z.literal("textMessage"),
  textMessageData: z.strictObject({ textMessage: z.string() })
})

const extendedTextMessageDataSchema = z.strictObject({
  typeMessage: z.literal("extendedTextMessage"),
  extendedTextMessageData: extendedTextSchema
})

type TTextMessageData = z.infer<typeof textMessageDataSchema | typeof extendedTextMessageDataSchema>

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

export type TMessageData = z.infer<typeof messageDataSchema>

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

export type TWebhook = z.infer<typeof webhookSchema>
export type TOutgoingMessageStatus = Extract<
  TWebhook,
  { typeWebhook: "outgoingMessageStatus" }
>["status"]

export type TUnknownWebhook = { typeWebhook: "unknown"; original: string; reason: string }

export const notificationEnvelopeSchema = z.strictObject({
  receiptId: z.number(),
  body: z.looseObject({ typeWebhook: z.string() })
})

export type TNotification = { receiptId: number; body: TWebhook | TUnknownWebhook }

export const webhookChatIdSchema = z.pipe(
  z.discriminatedUnion("typeWebhook", [
    z.object({ typeWebhook: z.literal("outgoingMessageStatus"), chatId: z.string() }),
    z.object({
      typeWebhook: z.literal([
        "incomingMessageReceived",
        "outgoingMessageReceived",
        "outgoingAPIMessageReceived"
      ]),
      senderData: z.object({ chatId: z.string() })
    })
  ]),
  z.transform((webhook) =>
    webhook.typeWebhook === "outgoingMessageStatus" ? webhook.chatId : webhook.senderData.chatId
  )
)

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
  typeMessage: z.literal(["textMessage", "extendedTextMessage"]),
  textMessage: z
    .string()
    .check(z.describe("У extendedTextMessage дублирует extendedTextMessage.text")),
  extendedTextMessage: z.optional(extendedTextSchema)
}

const journalTextMessageSchema = z.union([
  z.strictObject({ ...journalIncomingShape, ...journalTextShape }),
  z.strictObject({ ...journalOutgoingShape, ...journalTextShape })
])

export type TJournalTextMessage = z.infer<typeof journalTextMessageSchema>

export const journalEnvelopeSchema = z.array(
  z.looseObject({
    type: z.literal(["incoming", "outgoing"]),
    idMessage: idMessageSchema,
    timestamp: timestampSchema,
    chatId: z.string(),
    typeMessage: z.string()
  })
)

export type TJournalEnvelope = z.infer<typeof journalEnvelopeSchema>[number]

const journalUnsupportedMessageSchema = z.looseObject({
  type: z.literal(["incoming", "outgoing"]),
  idMessage: idMessageSchema,
  timestamp: timestampSchema,
  chatId: z.string(),
  typeMessage: z.string().check(z.refine(isNotTextType))
})

export const journalMessageSchema = z.union([
  journalTextMessageSchema,
  journalUnsupportedMessageSchema
])

type TUnknownJournalMessage = {
  type: TJournalEnvelope["type"]
  idMessage: string
  timestamp: number
  chatId: string
  typeMessage: "unknown"
  original: string
}

export type TJournalMessage = z.infer<typeof journalMessageSchema> | TUnknownJournalMessage
