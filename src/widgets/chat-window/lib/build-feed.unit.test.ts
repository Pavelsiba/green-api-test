import { describe, expect, it } from "vitest"
import type { TMessage } from "@/entities/chat"
import { buildFeed } from "./build-feed"

const at = (iso: string) => new Date(iso).getTime() / 1000

const message = (id: string, iso: string, direction: TMessage["direction"]): TMessage => ({
  id,
  chatId: "79001234567@c.us",
  direction,
  timestamp: at(iso),
  content: { type: "text", text: id }
})

describe("buildFeed", () => {
  it("puts a day capsule before the first message of each day", () => {
    const feed = buildFeed([
      message("a", "2026-09-25T10:00:00", "incoming"),
      message("b", "2026-09-26T10:00:00", "incoming")
    ])
    expect(feed.map((item) => item.type)).toEqual(["day", "message", "day", "message"])
  })

  it("marks the last message of a series by one author", () => {
    const feed = buildFeed([
      message("a", "2026-09-26T10:00:00", "incoming"),
      message("b", "2026-09-26T10:01:00", "incoming"),
      message("c", "2026-09-26T10:02:00", "outgoing"),
      message("d", "2026-09-26T10:30:00", "outgoing")
    ])
    const tails = feed.flatMap((item) =>
      item.type === "message" && item.isLastInGroup ? [item.message.id] : []
    )
    // «d» отделено от «c» паузой больше 5 минут — отдельная серия
    expect(tails).toEqual(["b", "c", "d"])
  })
})
