import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError, type TApiErrorKind } from "./api-error"
import { setCredentials } from "./api-instance"
import { greenApi } from "./green-api"

const credentials = {
  apiUrl: "https://7201.api.green-api.com/",
  idInstance: "7201000001",
  apiTokenInstance: "tkn"
}

/** Replays one canned response and records requests */
function mockFetch(body: string, status = 200) {
  const fetchMock = vi.fn(
    async (_url: string, _init?: RequestInit) => new Response(body, { status })
  )
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function mockFetchThrow(error: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw error
    })
  )
}

async function apiError(promise: Promise<unknown>): Promise<TApiErrorKind> {
  const e = await promise.then(
    () => {
      throw new Error("expected ApiError, got success")
    },
    (e: unknown) => e
  )
  expect(e).toBeInstanceOf(ApiError)
  return (e as ApiError).error
}

// Shapes copied from live responses on 2026-09-25, personal values replaced
const instanceData = { idInstance: 7201000001, wid: "79990000000@c.us", typeInstance: "whatsapp" }
const senderData = {
  chatId: "79001234567@c.us",
  sender: "79001234567@c.us",
  senderName: "Test",
  senderContactName: "Test",
  chatName: "Test"
}
const incomingText = {
  typeWebhook: "incomingMessageReceived",
  idMessage: "ACB17FD89BB3FBFDFFAEB4F5CCBC8477",
  instanceData,
  timestamp: 1790000000,
  senderData,
  messageData: { typeMessage: "textMessage", textMessageData: { textMessage: "hi" } }
}
const outgoingApiText = {
  typeWebhook: "outgoingAPIMessageReceived",
  idMessage: "3EB0859A4E2E1EDB8C4582",
  instanceData,
  timestamp: 1790000000,
  senderData,
  messageData: {
    typeMessage: "extendedTextMessage",
    extendedTextMessageData: {
      text: "тест",
      description: "",
      title: "",
      previewType: "None",
      jpegThumbnail: "",
      forwardingScore: 0,
      isForwarded: false
    }
  }
}
const statusRead = {
  typeWebhook: "outgoingMessageStatus",
  chatId: "79001234567@c.us",
  instanceData,
  timestamp: 1790000000,
  idMessage: "3EB0859A4E2E1EDB8C4582",
  sendByApi: true,
  status: "read"
}

const getState = (auth = credentials) => greenApi.getStateInstance({ auth })

beforeEach(() => setCredentials(credentials))
afterEach(() => {
  vi.unstubAllGlobals()
  setCredentials(null)
})

describe("url building", () => {
  it("puts token in the path and strips trailing slash from apiUrl", async () => {
    const fetchMock = mockFetch('{"stateInstance":"authorized"}')
    await getState()
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://7201.api.green-api.com/waInstance7201000001/getStateInstance/tkn"
    )
  })

  it("puts receiptId after the token for deleteNotification", async () => {
    const fetchMock = mockFetch('{"result":true,"reason":""}')
    await greenApi.deleteNotification(42)
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/deleteNotification\/tkn\/42$/)
    expect(fetchMock.mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("throws unauthorized without credentials and does not hit the network", async () => {
    setCredentials(null)
    const fetchMock = mockFetch("{}")
    expect(await apiError(greenApi.sendMessage({ chatId: "x@c.us", message: "hi" }))).toEqual({
      kind: "unauthorized"
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("getStateInstance", () => {
  it("unwraps stateInstance", async () => {
    mockFetch('{"stateInstance":"authorized"}')
    expect(await getState()).toBe("authorized")
  })

  it("uses explicit credentials over stored ones (login validation)", async () => {
    setCredentials(null)
    const fetchMock = mockFetch('{"stateInstance":"authorized"}')
    await getState({ ...credentials, apiTokenInstance: "candidate" })
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/getStateInstance\/candidate$/)
  })

  it("maps 401 with empty body (bad token) to unauthorized", async () => {
    mockFetch("", 401)
    expect(await apiError(getState())).toEqual({ kind: "unauthorized" })
  })

  it("maps nginx 404 html (unknown idInstance) to unauthorized", async () => {
    mockFetch("<html><head><title>404 Not Found</title></head></html>", 404)
    expect(await apiError(getState())).toEqual({ kind: "unauthorized" })
  })

  it("treats 200 with { status: false } as rejected", async () => {
    mockFetch('{"status":false,"reason":"instance is starting or not authorized"}')
    expect(await apiError(getState())).toEqual({
      kind: "rejected",
      reason: "instance is starting or not authorized"
    })
  })
})

describe("checkWhatsapp", () => {
  const missing =
    '{"existsWhatsapp":false,"chatId":"","username":"","phoneNumber":"","fromCache":false}'

  it("sends phoneNumber as a number", async () => {
    const fetchMock = mockFetch(missing)
    await greenApi.checkWhatsapp("79001234567")
    const init = fetchMock.mock.calls[0][1]
    expect(JSON.parse(String(init?.body))).toEqual({ phoneNumber: 79001234567 })
    expect(init?.headers).toEqual({ "Content-Type": "application/json" })
  })

  it("keys the chat by phoneNumber (@c.us), not chatId (@lid)", async () => {
    mockFetch(
      '{"existsWhatsapp":true,"chatId":"123456789@lid","username":"","phoneNumber":"79001234567@c.us","fromCache":true}'
    )
    expect(await greenApi.checkWhatsapp("79001234567")).toEqual({
      exists: true,
      chatId: "79001234567@c.us"
    })
  })

  it("reports a missing account", async () => {
    mockFetch(missing)
    expect(await greenApi.checkWhatsapp("12025550123")).toEqual({ exists: false })
  })

  it("maps 400 validation message", async () => {
    mockFetch(
      JSON.stringify({
        statusCode: 400,
        message:
          "Validation failed. Details: 'phoneNumber' must be a correct phone number and contains from 7 to 15 digits"
      }),
      400
    )
    expect(await apiError(greenApi.checkWhatsapp("1"))).toEqual({
      kind: "validation",
      message: expect.stringContaining("7 to 15 digits")
    })
  })

  it("maps 469 to contactLimit", async () => {
    mockFetch("User get contact info limit reached", 469)
    expect(await apiError(greenApi.checkWhatsapp("79001234567"))).toEqual({ kind: "contactLimit" })
  })
})

describe("sendMessage", () => {
  const send = () => greenApi.sendMessage({ chatId: "79001234567@c.us", message: "тест" })

  it("returns idMessage", async () => {
    mockFetch('{"idMessage":"3EB0859A4E2E1EDB8C4582"}')
    expect(await send()).toEqual({ idMessage: "3EB0859A4E2E1EDB8C4582" })
  })

  it("maps 403 to suspended", async () => {
    mockFetch('{"message":"Your account is suspended"}', 403)
    expect(await apiError(send())).toEqual({
      kind: "suspended",
      message: "Your account is suspended"
    })
  })

  it("maps 429 to rateLimited", async () => {
    mockFetch("", 429)
    expect(await apiError(send())).toEqual({ kind: "rateLimited" })
  })

  it("rejects an empty idMessage with the field path in the message", async () => {
    mockFetch('{"idMessage":""}')
    expect(await apiError(send())).toEqual({
      kind: "badResponse",
      message:
        "[sendMessage] validation failed:\n✖ Too small: expected string to have >=1 characters\n  → at idMessage"
    })
  })

  it("passes an unexpected field through with a drift warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    mockFetch('{"idMessage":"A","extra":1}')
    expect(await send()).toEqual({ idMessage: "A", extra: 1 })
    expect(warn).toHaveBeenCalledWith(
      '[sendMessage] schema drift, extra keys passed through:\n✖ Unrecognized key: "extra"'
    )
  })

  it("still fails when an extra key comes with a missing field", async () => {
    mockFetch('{"extra":1}')
    expect(await apiError(send())).toMatchObject({ kind: "badResponse" })
  })

  it("reports empty 200 as badResponse", async () => {
    mockFetch("")
    expect(await apiError(send())).toMatchObject({ kind: "badResponse" })
  })
})

describe("receiveNotification", () => {
  it.each([
    ["empty body", ""],
    ["literal null", "null"]
  ])("returns null for an empty queue (%s)", async (_label, body) => {
    mockFetch(body)
    expect(await greenApi.receiveNotification()).toBeNull()
  })

  it.each([
    ["incoming text", incomingText],
    ["outgoing API extended text", outgoingApiText],
    ["delivery status", statusRead]
  ])("parses a live-shaped %s webhook", async (_label, body) => {
    mockFetch(JSON.stringify({ receiptId: 5, body }))
    expect(await greenApi.receiveNotification()).toEqual({ receiptId: 5, body })
  })

  it("keeps media messages as unsupported instead of dropping them", async () => {
    const image = {
      ...incomingText,
      messageData: { typeMessage: "imageMessage", fileMessageData: { downloadUrl: "x" } }
    }
    mockFetch(JSON.stringify({ receiptId: 6, body: image }))
    const n = await greenApi.receiveNotification()
    expect(n?.body.typeWebhook).toBe("incomingMessageReceived")
  })

  it.each([
    [
      "a webhook type we did not enable",
      { typeWebhook: "incomingCall", from: "x" },
      "incomingCall"
    ],
    ["an @lid chat id", { ...statusRead, chatId: "123@lid" }, "outgoingMessageStatus"],
    ["a missing idMessage", { ...statusRead, idMessage: undefined }, "outgoingMessageStatus"],
    ["an unknown status", { ...statusRead, status: "exploded" }, "outgoingMessageStatus"]
  ])("turns %s into unknown, keeping receiptId for deletion", async (_label, body, original) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    mockFetch(JSON.stringify({ receiptId: 7, body }))
    expect(await greenApi.receiveNotification()).toEqual({
      receiptId: 7,
      body: { typeWebhook: "unknown", original, reason: expect.any(String) }
    })
    expect(warn).toHaveBeenCalled()
  })

  it.each([
    ["at the top level", { ...statusRead, newServerField: 1 }],
    [
      "inside a union branch (text message data)",
      {
        ...incomingText,
        messageData: { typeMessage: "textMessage", textMessageData: { textMessage: "hi", x: 1 } }
      }
    ],
    ["inside nested sender data", { ...incomingText, senderData: { ...senderData, isBot: false } }]
  ])("passes extra keys %s through with a drift warning", async (_label, body) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    mockFetch(JSON.stringify({ receiptId: 8, body }))
    expect(await greenApi.receiveNotification()).toEqual({ receiptId: 8, body })
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("schema drift, extra keys passed through")
    )
  })

  it("throws badResponse when the envelope has no receiptId", async () => {
    mockFetch(JSON.stringify({ body: statusRead }))
    expect(await apiError(greenApi.receiveNotification())).toEqual({
      kind: "badResponse",
      message:
        "[receiveNotification] validation failed:\n✖ Invalid input: expected number, received undefined\n  → at receiptId"
    })
  })

  it("maps non-JSON 200 to badResponse", async () => {
    mockFetch("<html>oops</html>")
    expect(await apiError(greenApi.receiveNotification())).toMatchObject({ kind: "badResponse" })
  })
})

describe("deleteNotification", () => {
  it("returns true on first delete", async () => {
    mockFetch('{"result":true,"reason":""}')
    expect(await greenApi.deleteNotification(4)).toBe(true)
  })

  it("returns false, not an error, when receipt is already gone", async () => {
    mockFetch('{"result":false,"reason":"Message receiptId = 4 not found"}')
    expect(await greenApi.deleteNotification(4)).toBe(false)
  })
})

describe("transport failures", () => {
  it("maps a thrown fetch to network", async () => {
    mockFetchThrow(new TypeError("Failed to fetch"))
    expect(await apiError(greenApi.receiveNotification())).toEqual({
      kind: "network",
      message: "Failed to fetch"
    })
  })

  it("rethrows AbortError untouched so TanStack Query sees a cancel", async () => {
    const abort = new DOMException("aborted", "AbortError")
    mockFetchThrow(abort)
    await expect(greenApi.receiveNotification()).rejects.toBe(abort)
  })
})
