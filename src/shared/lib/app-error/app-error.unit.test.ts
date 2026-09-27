import { describe, expect, it } from "vitest"
import { AppError, isAppError } from "./app-error"

describe("AppError", () => {
  it("keeps the source and the detail", () => {
    const error = new AppError("auth", { kind: "instanceState", state: "blocked" })
    expect(error).toBeInstanceOf(Error)
    expect(error).toMatchObject({
      source: "auth",
      detail: { kind: "instanceState", state: "blocked" },
      message: "auth: instanceState"
    })
  })

  it("matches its own source and a known kind only", () => {
    const kinds = ["noWhatsapp"]
    expect(
      isAppError(new AppError("start-chat", { kind: "noWhatsapp" }), "start-chat", kinds)
    ).toBe(true)
    expect(isAppError(new AppError("api", { kind: "noWhatsapp" }), "start-chat", kinds)).toBe(false)
    expect(isAppError(new Error("plain"), "start-chat", kinds)).toBe(false)
  })

  it("does not trust an unknown kind under a known source", () => {
    const foreign = new AppError("start-chat", { kind: "somethingElse" })
    expect(isAppError(foreign, "start-chat", ["noWhatsapp"])).toBe(false)
  })
})
