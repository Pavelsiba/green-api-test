import { describe, expect, it } from "vitest"
import { createApiError } from "@/shared/api"
import { createInstanceStateError } from "./auth-error"
import { getLoginErrorMessage } from "./get-login-error-message"

describe("getLoginErrorMessage", () => {
  it("explains known instance states", () => {
    expect(getLoginErrorMessage(createInstanceStateError("notAuthorized"))).toMatch(/QR-код/)
  })

  it("names an unknown instance state instead of hiding it", () => {
    expect(getLoginErrorMessage(createInstanceStateError("newState"))).toMatch(/«newState»/)
  })

  it("maps known transport errors", () => {
    expect(getLoginErrorMessage(createApiError({ kind: "unauthorized" }))).toMatch(/Неверный/)
    expect(getLoginErrorMessage(createApiError({ kind: "network", message: "x" }))).toMatch(
      /apiUrl/
    )
  })

  it("falls back for other transport errors and foreign exceptions", () => {
    expect(
      getLoginErrorMessage(createApiError({ kind: "http", status: 502, message: "" }))
    ).toMatch(/\(http\)/)
    expect(getLoginErrorMessage(new Error("boom"))).toMatch(/Не удалось войти/)
  })
})
