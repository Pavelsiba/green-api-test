import { describe, expect, it } from "vitest"
import { normalizePhone, phoneSchema } from "./normalize-phone"

describe("normalizePhone", () => {
  it("strips formatting and turns a leading 8 into 7", () => {
    expect(normalizePhone("+7 (900) 123-45-67")).toBe("79001234567")
    expect(normalizePhone("8 900 123 45 67")).toBe("79001234567")
    expect(normalizePhone("+49 151 1234 5678")).toBe("4915112345678")
  })
})

describe("phoneSchema", () => {
  it("accepts 10–15 digits only", () => {
    expect(phoneSchema.safeParse("79001234567").success).toBe(true)
    expect(phoneSchema.safeParse("900123").success).toBe(false)
    expect(phoneSchema.safeParse("1234567890123456").success).toBe(false)
  })
})
