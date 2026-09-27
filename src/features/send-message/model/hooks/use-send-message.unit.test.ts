import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { chatQueryKeys, type TMessage } from "@/entities/chat"
import { createApiError, greenApi } from "@/shared/api"
import { createQueryWrapper } from "@/shared/lib"
import { useSendMessage } from "./use-send-message"

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  greenApi: { sendMessage: vi.fn() }
}))

const chatId = "79001234567@c.us"

function setup() {
  const { wrapper, queryClient } = createQueryWrapper()
  queryClient.setQueryData<TMessage[]>(chatQueryKeys.history(chatId), [])
  const { result } = renderHook(() => useSendMessage(), { wrapper })
  const history = () => queryClient.getQueryData<TMessage[]>(chatQueryKeys.history(chatId)) ?? []
  return { result, history }
}

afterEach(() => vi.clearAllMocks())

describe("useSendMessage", () => {
  it("shows the message at once and swaps in the server id on success", async () => {
    let resolve: (value: { idMessage: string }) => void = () => {}
    vi.mocked(greenApi.sendMessage).mockReturnValue(
      new Promise((done) => {
        resolve = done
      })
    )
    const { result, history } = setup()

    act(() => result.current.send(chatId, "привет"))

    await waitFor(() =>
      expect(history()).toEqual([
        expect.objectContaining({
          id: expect.stringMatching(/^local-/),
          status: "sending",
          content: { type: "text", text: "привет" }
        })
      ])
    )

    act(() => resolve({ idMessage: "srv-1" }))

    await waitFor(() =>
      expect(history()).toEqual([expect.objectContaining({ id: "srv-1", status: "sent" })])
    )
    expect(greenApi.sendMessage).toHaveBeenCalledWith({ chatId, message: "привет" })
  })

  it("marks the message failed when sending fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.mocked(greenApi.sendMessage).mockRejectedValue(createApiError({ kind: "rateLimited" }))
    const { result, history } = setup()

    act(() => result.current.send(chatId, "привет"))

    await waitFor(() => expect(history()[0]?.status).toBe("failed"))
    warn.mockRestore()
  })
})
