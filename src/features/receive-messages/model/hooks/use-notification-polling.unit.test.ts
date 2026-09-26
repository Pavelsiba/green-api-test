import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { chatQueryKeys, type TMessage } from "@/entities/chat"
import { greenApi, type TNotification } from "@/shared/api"
import { createQueryWrapper } from "@/shared/lib"
import { useNotificationPolling } from "./use-notification-polling"

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  greenApi: { receiveNotification: vi.fn(), deleteNotification: vi.fn() }
}))

const chatId = "79001234567@c.us"

const incoming: TNotification = {
  receiptId: 1,
  body: {
    typeWebhook: "incomingMessageReceived",
    idMessage: "in-1",
    timestamp: 100,
    instanceData: { idInstance: 1, wid: "79990000000@c.us", typeInstance: "whatsapp" },
    senderData: { chatId, sender: chatId, senderName: "Test" },
    messageData: { typeMessage: "textMessage", textMessageData: { textMessage: "hi" } }
  }
}

const unknown: TNotification = {
  receiptId: 2,
  body: { typeWebhook: "unknown", original: "deviceInfo", reason: "not modelled" }
}

/** Отдаёт уведомления по очереди, дальше — пустая очередь */
function queue(...notifications: TNotification[]) {
  const pending = [...notifications]
  vi.mocked(greenApi.receiveNotification).mockImplementation(async () => pending.shift() ?? null)
  vi.mocked(greenApi.deleteNotification).mockResolvedValue(true)
}

afterEach(() => vi.clearAllMocks())

describe("useNotificationPolling", () => {
  it("applies a notification to the cache and deletes it from the queue", async () => {
    queue(incoming)
    const { wrapper, queryClient } = createQueryWrapper()
    queryClient.setQueryData<TMessage[]>(chatQueryKeys.history(chatId), [])

    const { unmount } = renderHook(() => useNotificationPolling(), { wrapper })

    await waitFor(() => expect(greenApi.deleteNotification).toHaveBeenCalledWith(1))
    expect(queryClient.getQueryData<TMessage[]>(chatQueryKeys.history(chatId))).toEqual([
      expect.objectContaining({ id: "in-1", direction: "incoming" })
    ])
    unmount()
  })

  it("deletes notifications it could not parse, so the queue does not get stuck", async () => {
    queue(unknown)
    const { wrapper } = createQueryWrapper()

    const { unmount } = renderHook(() => useNotificationPolling(), { wrapper })

    await waitFor(() => expect(greenApi.deleteNotification).toHaveBeenCalledWith(2))
    unmount()
  })

  it("aborts the pending long-poll on unmount", async () => {
    let received: AbortSignal | undefined
    vi.mocked(greenApi.receiveNotification).mockImplementation(
      (signal) =>
        new Promise((_resolve, reject) => {
          received = signal
          signal?.addEventListener("abort", () => reject(signal.reason))
        })
    )
    const { wrapper } = createQueryWrapper()

    const { unmount } = renderHook(() => useNotificationPolling(), { wrapper })
    await waitFor(() => expect(received).toBeDefined())
    unmount()

    expect(received?.aborted).toBe(true)
  })
})
