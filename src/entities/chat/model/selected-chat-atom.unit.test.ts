import { waitFor } from "@testing-library/react"
import { createStore } from "jotai"
import { beforeEach, describe, expect, it, vi } from "vitest"

const chatA = "79001234567@c.us"
const chatB = "79007654321@c.us"

const loadAtom = async () => {
  vi.resetModules()
  const { selectedChatIdAtom } = await import("./selected-chat-atom")
  const store = createStore()
  const unsubscribe = store.sub(selectedChatIdAtom, () => {})
  return { store, selectedChatIdAtom, unsubscribe }
}

describe("selectedChatIdAtom", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/")
  })

  it("restores the open chat from the hash after a reload", async () => {
    window.history.replaceState(null, "", "/#79001234567")
    const { store, selectedChatIdAtom } = await loadAtom()
    expect(store.get(selectedChatIdAtom)).toBe(chatA)
  })

  it("adds a history entry when a chat opens and replaces it when switching", async () => {
    const { store, selectedChatIdAtom } = await loadAtom()
    const initialLength = window.history.length

    store.set(selectedChatIdAtom, chatA)
    expect(window.location.hash).toBe("#79001234567")
    expect(window.history.length).toBe(initialLength + 1)

    store.set(selectedChatIdAtom, chatB)
    expect(window.location.hash).toBe("#79007654321")
    expect(window.history.length).toBe(initialLength + 1)
  })

  it("goes back to the list on the browser back button", async () => {
    const { store, selectedChatIdAtom } = await loadAtom()
    store.set(selectedChatIdAtom, chatA)

    window.history.back()

    await waitFor(() => expect(store.get(selectedChatIdAtom)).toBeNull())
    expect(window.location.hash).toBe("")
  })

  it("closes an app-opened chat by stepping back in history", async () => {
    const { store, selectedChatIdAtom } = await loadAtom()
    store.set(selectedChatIdAtom, chatA)

    store.set(selectedChatIdAtom, null)

    expect(store.get(selectedChatIdAtom)).toBeNull()
    await waitFor(() => expect(window.location.hash).toBe(""))
  })

  it("clears the hash without leaving the page when the chat came from a link", async () => {
    window.history.replaceState(null, "", "/#79001234567")
    const { store, selectedChatIdAtom } = await loadAtom()
    const back = vi.spyOn(window.history, "back")

    store.set(selectedChatIdAtom, null)

    expect(back).not.toHaveBeenCalled()
    expect(window.location.hash).toBe("")
    expect(store.get(selectedChatIdAtom)).toBeNull()
  })
})
