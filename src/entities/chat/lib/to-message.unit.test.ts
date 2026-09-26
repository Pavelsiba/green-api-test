import { describe, expect, it } from "vitest"
import type { TJournalMessage } from "@/shared/api"
import { journalToMessage, type TMessageWebhook, webhookToMessage } from "./to-message"

const webhookBase = {
  idMessage: "W1",
  timestamp: 100,
  instanceData: { idInstance: 1, wid: "79990000000@c.us", typeInstance: "whatsapp" },
  senderData: {
    chatId: "79001234567@c.us",
    sender: "79001234567@c.us",
    senderName: "Test"
  }
}

describe("journalToMessage", () => {
  it("maps an outgoing text entry with its status", () => {
    const entry = {
      type: "outgoing",
      idMessage: "J1",
      timestamp: 100,
      chatId: "79001234567@c.us",
      typeMessage: "extendedTextMessage",
      textMessage: "ссылка",
      extendedTextMessage: { text: "ссылка" },
      statusMessage: "delivered",
      sendByApi: false,
      deletedMessageId: "",
      editedMessageId: "",
      isEdited: false,
      isDeleted: false
    } as TJournalMessage

    expect(journalToMessage(entry)).toEqual({
      id: "J1",
      chatId: "79001234567@c.us",
      direction: "outgoing",
      timestamp: 100,
      content: { type: "text", text: "ссылка" },
      status: "delivered"
    })
  })

  it("keeps media and broken entries as unsupported", () => {
    const media = { type: "incoming" as const, idMessage: "M", timestamp: 1, chatId: "a@c.us" }
    expect(
      journalToMessage({ ...media, typeMessage: "imageMessage" } as TJournalMessage).content
    ).toEqual({ type: "unsupported", typeMessage: "imageMessage" })
    expect(
      journalToMessage({ ...media, typeMessage: "unknown", original: "textMessage" }).content
    ).toEqual({ type: "unsupported", typeMessage: "unknown" })
  })
})

describe("webhookToMessage", () => {
  it("maps an incoming text webhook without status", () => {
    const webhook = {
      ...webhookBase,
      typeWebhook: "incomingMessageReceived",
      messageData: { typeMessage: "textMessage", textMessageData: { textMessage: "hi" } }
    } as TMessageWebhook

    expect(webhookToMessage(webhook)).toEqual({
      id: "W1",
      chatId: "79001234567@c.us",
      direction: "incoming",
      timestamp: 100,
      content: { type: "text", text: "hi" },
      status: undefined
    })
  })

  it("reads extended text and marks outgoing as sent", () => {
    const webhook = {
      ...webhookBase,
      typeWebhook: "outgoingAPIMessageReceived",
      messageData: { typeMessage: "extendedTextMessage", extendedTextMessageData: { text: "api" } }
    } as TMessageWebhook

    expect(webhookToMessage(webhook)).toMatchObject({
      direction: "outgoing",
      content: { type: "text", text: "api" },
      status: "sent"
    })
  })
})
