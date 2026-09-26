import { describe, expect, it } from "vitest"
import { ApiError } from "@/shared/api"
import { getPollInterval } from "./get-poll-interval"

describe("getPollInterval", () => {
  it("polls every second while everything is fine", () => {
    expect(getPollInterval(null)).toBe(1000)
  })

  it("slows down after a failure", () => {
    expect(getPollInterval(new ApiError({ kind: "http", status: 408, message: "" }))).toBe(5000)
    expect(getPollInterval(new Error("offline"))).toBe(5000)
  })

  it("stops when credentials are rejected", () => {
    expect(getPollInterval(new ApiError({ kind: "unauthorized" }))).toBe(false)
  })
})
