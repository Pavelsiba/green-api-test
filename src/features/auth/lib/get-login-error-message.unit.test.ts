import { describe, expect, it } from "vitest"
import { ApiError } from "@/shared/api"
import { getLoginErrorMessage } from "./get-login-error-message"
import { InstanceStateError } from "./instance-state-error"

describe("getLoginErrorMessage", () => {
  it("explains known instance states", () => {
    expect(getLoginErrorMessage(new InstanceStateError("notAuthorized"))).toMatch(/QR-код/)
  })

  it("names an unknown instance state instead of hiding it", () => {
    expect(getLoginErrorMessage(new InstanceStateError("newState"))).toMatch(/«newState»/)
  })

  it("maps known transport errors", () => {
    expect(getLoginErrorMessage(new ApiError({ kind: "unauthorized" }))).toMatch(/Неверный/)
    expect(getLoginErrorMessage(new ApiError({ kind: "network", message: "x" }))).toMatch(/apiUrl/)
  })

  it("falls back for other transport errors and foreign exceptions", () => {
    expect(getLoginErrorMessage(new ApiError({ kind: "http", status: 502, message: "" }))).toMatch(
      /\(http\)/
    )
    expect(getLoginErrorMessage(new Error("boom"))).toMatch(/Не удалось войти/)
  })
})
