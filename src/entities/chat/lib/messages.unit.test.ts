import { describe, expect, it } from "vitest"
import type { TChatPreview, TMessage } from "../model/types"
import {
  addEmptyChat,
  applyMessageToChats,
  applyStatusToChats,
  confirmMessage,
  setMessageStatus,
  upsertMessage
} from "./messages"

const message = (overrides: Partial<TMessage>): TMessage => ({
  id: "id-1",
  chatId: "79001234567@c.us",
  direction: "outgoing",
  timestamp: 100,
  content: { type: "text", text: "hi" },
  ...overrides
})

describe("upsertMessage", () => {
  it("inserts by timestamp", () => {
    const feed = [message({ id: "a", timestamp: 100 }), message({ id: "c", timestamp: 300 })]
    const result = upsertMessage(feed, message({ id: "b", timestamp: 200 }))
    expect(result.map((item) => item.id)).toEqual(["a", "b", "c"])
  })

  it("does not duplicate a repeated message and keeps the later status", () => {
    const feed = [message({ id: "a", status: "read" })]
    const result = upsertMessage(feed, message({ id: "a", status: "sent" }))
    expect(result).toHaveLength(1)
    expect(result[0]?.status).toBe("read")
  })
})

describe("confirmMessage", () => {
  it("swaps the local id for the server id", () => {
    const result = confirmMessage([message({ id: "local-1", status: "sending" })], "local-1", "srv")
    expect(result).toEqual([expect.objectContaining({ id: "srv", status: "sent" })])
  })

  it("drops the local copy when the webhook already added the server one", () => {
    const feed = [
      message({ id: "local-1", status: "sending" }),
      message({ id: "srv", status: "delivered" })
    ]
    const result = confirmMessage(feed, "local-1", "srv")
    expect(result).toEqual([expect.objectContaining({ id: "srv", status: "delivered" })])
  })
})

describe("setMessageStatus", () => {
  it("never moves ticks back when statuses arrive out of order", () => {
    const read = setMessageStatus([message({ status: "read" })], "id-1", "delivered")
    expect(read[0]?.status).toBe("read")
  })

  it("lets a failure override progress", () => {
    const failed = setMessageStatus([message({ status: "sent" })], "id-1", "failed")
    expect(failed[0]?.status).toBe("failed")
  })
})

describe("applyMessageToChats", () => {
  const chat = (overrides: Partial<TChatPreview>): TChatPreview => ({
    chatId: "79001234567@c.us",
    name: null,
    lastMessage: null,
    unreadCount: 0,
    ...overrides
  })

  it("creates a chat for a new sender and puts it on top", () => {
    const chats = [chat({ chatId: "old@c.us", lastMessage: message({ timestamp: 50 }) })]
    const incoming = message({ chatId: "new@c.us", direction: "incoming", timestamp: 100 })
    const result = applyMessageToChats(chats, incoming, { name: "Test", unread: true })
    expect(result.map((item) => item.chatId)).toEqual(["new@c.us", "old@c.us"])
    expect(result[0]).toMatchObject({ name: "Test", unreadCount: 1 })
  })

  it("counts a repeated webhook once", () => {
    const incoming = message({ direction: "incoming" })
    const once = applyMessageToChats([], incoming, { unread: true })
    const twice = applyMessageToChats(once, incoming, { unread: true })
    expect(twice[0]?.unreadCount).toBe(1)
  })

  it("keeps a known name and the newer last message", () => {
    const newer = message({ id: "new", timestamp: 200 })
    const chats = [chat({ name: "Контакт", lastMessage: newer })]
    const older = message({ id: "old", timestamp: 100 })
    const result = applyMessageToChats(chats, older, { name: "Профиль", unread: false })
    expect(result[0]).toMatchObject({ name: "Контакт", lastMessage: { id: "new" } })
  })
})

describe("applyStatusToChats / addEmptyChat", () => {
  it("updates ticks in the preview only for its last message", () => {
    const chats: TChatPreview[] = [
      { chatId: "a@c.us", name: null, lastMessage: message({ id: "m" }), unreadCount: 0 }
    ]
    expect(applyStatusToChats(chats, "a@c.us", "m", "read")[0]?.lastMessage?.status).toBe("read")
    expect(applyStatusToChats(chats, "a@c.us", "other", "read")[0]?.lastMessage?.status).toBe(
      undefined
    )
  })

  it("adds an empty chat on top and ignores a known one", () => {
    const chats: TChatPreview[] = [
      { chatId: "a@c.us", name: null, lastMessage: message({}), unreadCount: 0 }
    ]
    expect(addEmptyChat(chats, "b@c.us")[0]?.chatId).toBe("b@c.us")
    expect(addEmptyChat(chats, "a@c.us")).toHaveLength(1)
  })
})
