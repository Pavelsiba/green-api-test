import { describe, expect, it } from "vitest"
import { AppError } from "@/shared/lib"
import { createApiError, isTransientError, isUnauthorizedError } from "./api-error"

describe("isTransientError", () => {
  it.each([
    ["a network failure", createApiError({ kind: "network", message: "x" })],
    ["a rate limit", createApiError({ kind: "rateLimited" })],
    ["a 5xx", createApiError({ kind: "http", status: 502, message: "" })],
    ["an unexpected non-app error", new TypeError("boom")]
  ])("retries %s", (_label, error) => {
    expect(isTransientError(error)).toBe(true)
  })

  it.each([
    ["the contact limit (antifraud)", createApiError({ kind: "contactLimit" })],
    ["bad credentials", createApiError({ kind: "unauthorized" })],
    ["a feature error", new AppError("start-chat", { kind: "noWhatsapp" })]
  ])("does not retry %s", (_label, error) => {
    expect(isTransientError(error)).toBe(false)
  })
})

describe("isUnauthorizedError", () => {
  it("recognises only the api unauthorized kind", () => {
    expect(isUnauthorizedError(createApiError({ kind: "unauthorized" }))).toBe(true)
    expect(isUnauthorizedError(new AppError("auth", { kind: "unauthorized" }))).toBe(false)
  })
})
