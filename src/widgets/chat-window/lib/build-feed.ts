import { getDayKey, type TMessage } from "@/entities/chat"

export type TFeedItem =
  | { type: "day"; key: string; timestamp: number }
  | { type: "message"; key: string; message: TMessage; isLastInGroup: boolean }

/** Серия — подряд идущие сообщения одного направления в пределах 5 минут */
const GROUP_GAP_SECONDS = 5 * 60

const isSameGroup = (current: TMessage, next: TMessage | undefined) =>
  next !== undefined &&
  next.direction === current.direction &&
  getDayKey(next.timestamp) === getDayKey(current.timestamp) &&
  next.timestamp - current.timestamp <= GROUP_GAP_SECONDS

/** Лента: капсула дня перед первым сообщением каждого дня, «хвост» у последнего в серии */
export function buildFeed(messages: readonly TMessage[]): TFeedItem[] {
  const items: TFeedItem[] = []
  messages.forEach((message, index) => {
    const previous = messages[index - 1]
    if (!previous || getDayKey(previous.timestamp) !== getDayKey(message.timestamp)) {
      items.push({
        type: "day",
        key: `day-${getDayKey(message.timestamp)}`,
        timestamp: message.timestamp
      })
    }
    items.push({
      type: "message",
      key: message.id,
      message,
      isLastInGroup: !isSameGroup(message, messages[index + 1])
    })
  })
  return items
}
