import { afterEach, describe, expect, it } from "vitest"
import { isFocusLost } from "./is-focus-lost"

describe("isFocusLost", () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it("is lost when nothing is focused", () => {
    expect(isFocusLost()).toBe(true)
  })

  it("is kept on a visible focused element", () => {
    const button = document.createElement("button")
    document.body.append(button)
    button.focus()
    expect(isFocusLost()).toBe(false)
  })

  it("is lost when the focused element gets hidden", () => {
    const button = document.createElement("button")
    document.body.append(button)
    button.focus()
    button.checkVisibility = () => false
    expect(isFocusLost()).toBe(true)
  })
})
