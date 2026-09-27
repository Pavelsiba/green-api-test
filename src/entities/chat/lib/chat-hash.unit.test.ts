import { describe, expect, it } from "vitest"
import { chatIdFromHash, hashFromChatId } from "./chat-hash"

describe("chatIdFromHash", () => {
  it.each([
    ["#79001234567", "79001234567@c.us"],
    ["79001234567", "79001234567@c.us"]
  ])("reads a phone from %s", (hash, chatId) => {
    expect(chatIdFromHash(hash)).toBe(chatId)
  })

  it.each([[""], ["#"], ["#abc"], ["#7900123456x"], ["#123"], ["#79001234567@c.us"]])(
    "treats %j as no chat",
    (hash) => {
      expect(chatIdFromHash(hash)).toBeNull()
    }
  )
})

describe("hashFromChatId", () => {
  it("keeps only the phone", () => {
    expect(hashFromChatId("79001234567@c.us")).toBe("#79001234567")
  })
})
