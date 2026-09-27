import { describe, expect, it } from "vitest"
import { chatQueryKeys, type TChatPreview, type TMessage } from "@/entities/chat"
import type { TWebhook } from "@/shared/api"
import { createQueryWrapper } from "@/shared/lib"
import { applyNotification } from "./apply-notification"

const chatId = "79001234567@c.us"
const instanceData = { idInstance: 1, wid: "79990000000@c.us", typeInstance: "whatsapp" }
const senderData = {
  chatId,
  sender: chatId,
  senderName: "Профиль",
  senderContactName: "Контакт"
}

const incoming = (idMessage: string): TWebhook => ({
  typeWebhook: "incomingMessageReceived",
  idMessage,
  timestamp: 200,
  instanceData,
  senderData,
  messageData: { typeMessage: "textMessage", textMessageData: { textMessage: "hi" } }
})

function setup(history: TMessage[] = []) {
  const { queryClient } = createQueryWrapper()
  queryClient.setQueryData<TChatPreview[]>(chatQueryKeys.list(), [])
  queryClient.setQueryData<TMessage[]>(chatQueryKeys.history(chatId), history)
  const read = () => ({
    list: queryClient.getQueryData<TChatPreview[]>(chatQueryKeys.list()) ?? [],
    history: queryClient.getQueryData<TMessage[]>(chatQueryKeys.history(chatId)) ?? []
  })
  return { queryClient, read }
}

describe("applyNotification", () => {
  it("adds an incoming message and counts it unread when the chat is closed", () => {
    const { queryClient, read } = setup()

    applyNotification(incoming("in-1"), { queryClient, selectedChatId: null })

    expect(read().history.map((message) => message.id)).toEqual(["in-1"])
    expect(read().list[0]).toMatchObject({ chatId, name: "Контакт", unreadCount: 1 })
  })

  it("does not count unread in the open chat", () => {
    const { queryClient, read } = setup()

    applyNotification(incoming("in-1"), { queryClient, selectedChatId: chatId })

    expect(read().list[0]?.unreadCount).toBe(0)
  })

  it("does not duplicate our own message echoed by outgoingAPIMessageReceived", () => {
    const own: TMessage = {
      id: "srv-1",
      chatId,
      direction: "outgoing",
      timestamp: 100,
      content: { type: "text", text: "api" },
      status: "delivered"
    }
    const { queryClient, read } = setup([own])

    applyNotification(
      {
        typeWebhook: "outgoingAPIMessageReceived",
        idMessage: "srv-1",
        timestamp: 100,
        instanceData,
        senderData,
        messageData: {
          typeMessage: "extendedTextMessage",
          extendedTextMessageData: { text: "api" }
        }
      },
      { queryClient, selectedChatId: chatId }
    )

    expect(read().history).toEqual([own])
  })

  it("moves ticks on outgoingMessageStatus", () => {
    const own: TMessage = {
      id: "srv-1",
      chatId,
      direction: "outgoing",
      timestamp: 100,
      content: { type: "text", text: "hi" },
      status: "sent"
    }
    const { queryClient, read } = setup([own])

    applyNotification(
      {
        typeWebhook: "outgoingMessageStatus",
        chatId,
        idMessage: "srv-1",
        timestamp: 101,
        instanceData,
        status: "read",
        sendByApi: true
      },
      { queryClient, selectedChatId: null }
    )

    expect(read().history[0]?.status).toBe("read")
  })

  it("ignores webhooks the transport could not parse", () => {
    const { queryClient, read } = setup()

    applyNotification(
      { typeWebhook: "unknown", original: "deviceInfo", reason: "not modelled" },
      { queryClient, selectedChatId: null }
    )

    expect(read()).toEqual({ list: [], history: [] })
  })
})
