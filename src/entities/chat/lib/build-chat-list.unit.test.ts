import { describe, expect, it } from "vitest"
import type { TJournalMessage } from "@/shared/api"
import { buildChatList } from "./build-chat-list"

const base = {
  deletedMessageId: "",
  editedMessageId: "",
  isEdited: false,
  isDeleted: false
}

const incoming = (overrides: Record<string, unknown>) =>
  ({
    ...base,
    type: "incoming",
    idMessage: "in-1",
    timestamp: 100,
    typeMessage: "textMessage",
    chatId: "79001234567@c.us",
    textMessage: "привет",
    senderId: "79001234567@c.us",
    senderName: "Профиль",
    senderContactName: "",
    ...overrides
  }) as TJournalMessage

const outgoing = (overrides: Record<string, unknown>) =>
  ({
    ...base,
    type: "outgoing",
    idMessage: "out-1",
    timestamp: 200,
    typeMessage: "textMessage",
    chatId: "79001234567@c.us",
    textMessage: "ответ",
    statusMessage: "read",
    sendByApi: true,
    ...overrides
  }) as TJournalMessage

describe("buildChatList", () => {
  it("merges incoming and outgoing into one chat with the newest message", () => {
    const [chat] = buildChatList([incoming({}), outgoing({})])
    expect(chat).toMatchObject({
      chatId: "79001234567@c.us",
      name: "Профиль",
      lastMessage: { id: "out-1", direction: "outgoing", status: "read" }
    })
  })

  it("prefers the phone contact name over the profile name", () => {
    const [chat] = buildChatList([incoming({ senderContactName: "Контакт" })])
    expect(chat?.name).toBe("Контакт")
  })

  it("drops group chats", () => {
    expect(buildChatList([incoming({ chatId: "120363000000000000@g.us" })])).toEqual([])
  })

  it("counts unread incoming messages", () => {
    const chats = buildChatList([
      incoming({ idMessage: "a", isRead: false }),
      incoming({ idMessage: "b", isRead: false }),
      incoming({ idMessage: "c", isRead: true })
    ])
    expect(chats[0]?.unreadCount).toBe(2)
  })

  it("sorts chats by last message, newest first", () => {
    const chats = buildChatList([
      incoming({ chatId: "old@c.us", timestamp: 10 }),
      outgoing({ chatId: "new@c.us", timestamp: 20 })
    ])
    expect(chats.map((chat) => chat.chatId)).toEqual(["new@c.us", "old@c.us"])
  })
})
