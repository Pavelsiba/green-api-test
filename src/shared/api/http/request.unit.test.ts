import { afterEach, describe, expect, it, vi } from "vitest"
import { request } from "./request"

const mockFetch = (body: string, status = 200) => {
  const fetchMock = vi.fn(async () => new Response(body, { status }))
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("request", () => {
  it.each([
    ["JSON", '{"ok":true}', { ok: true }],
    ["an empty body as null", "", null],
    ["a non-JSON body as undefined", "<html>", undefined]
  ])("parses %s", async (_label, text, body) => {
    mockFetch(text)
    expect(await request("https://api.test")).toEqual({ status: 200, ok: true, body, text })
  })

  it("sends json as a body with the content type", async () => {
    const fetchMock = mockFetch("{}")
    await request("https://api.test", { method: "POST", json: { id: 1 } })
    expect(fetchMock).toHaveBeenCalledWith("https://api.test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"id":1}'
    })
  })

  it("returns a status outside 2xx instead of throwing", async () => {
    mockFetch('{"message":"bad"}', 400)
    expect(await request("https://api.test")).toEqual({
      status: 400,
      ok: false,
      body: { message: "bad" },
      text: '{"message":"bad"}'
    })
  })

  it("lets fetch exceptions through untouched", async () => {
    const abort = new DOMException("aborted", "AbortError")
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw abort
      })
    )
    await expect(request("https://api.test")).rejects.toBe(abort)
  })
})
