import { describe, expect, it } from "vitest"
import { formatDayLabel, formatListTime, formatPhone, getInitials } from "./format"

const at = (iso: string) => new Date(iso).getTime() / 1000
const now = new Date("2026-09-26T15:00:00")

describe("formatPhone", () => {
  it("formats Russian numbers and leaves others as digits", () => {
    expect(formatPhone("79001234567@c.us")).toBe("+7 900 123-45-67")
    expect(formatPhone("4915112345678@c.us")).toBe("+4915112345678")
  })
})

describe("getInitials", () => {
  it("takes two first letters of words, or last digits of a number", () => {
    expect(getInitials("Таисия доча")).toBe("ТД")
    expect(getInitials("Anna")).toBe("A")
    expect(getInitials("+7 900 123-45-67")).toBe("67")
  })
})

describe("formatDayLabel", () => {
  it("names today and yesterday, dates otherwise", () => {
    expect(formatDayLabel(at("2026-09-26T01:00:00"), now)).toBe("Сегодня")
    expect(formatDayLabel(at("2026-09-25T23:59:00"), now)).toBe("Вчера")
    expect(formatDayLabel(at("2026-09-01T12:00:00"), now)).toBe("1 сентября")
    expect(formatDayLabel(at("2025-03-03T12:00:00"), now)).toBe("3 марта 2025")
  })
})

describe("formatListTime", () => {
  it("shows time for today and a short date before", () => {
    expect(formatListTime(at("2026-09-26T09:05:00"), now)).toBe("09:05")
    expect(formatListTime(at("2026-09-24T09:05:00"), now)).toBe("24.09")
  })
})
