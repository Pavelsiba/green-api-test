import { useLayoutEffect, useRef } from "react"

/** Считаем, что пользователь «внизу», если до конца ленты меньше этого */
const BOTTOM_THRESHOLD_PX = 80

/**
 * Лента прилипает к низу: при открытии чата, при своём отправленном сообщении и при
 * входящем, если пользователь и так был внизу. Если он листает историю — не дёргаем.
 */
export function useStickToBottom({
  chatId,
  messageCount,
  lastIsOwnSending
}: {
  chatId: string
  messageCount: number
  lastIsOwnSending: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const lastChatIdRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element || messageCount === 0) return
    const isNewChat = lastChatIdRef.current !== chatId
    lastChatIdRef.current = chatId
    if (isNewChat || lastIsOwnSending || isAtBottomRef.current) {
      element.scrollTop = element.scrollHeight
      isAtBottomRef.current = true
    }
  }, [chatId, messageCount, lastIsOwnSending])

  const handleScroll = () => {
    const element = scrollRef.current
    if (!element) return
    isAtBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < BOTTOM_THRESHOLD_PX
  }

  return { scrollRef, handleScroll }
}
