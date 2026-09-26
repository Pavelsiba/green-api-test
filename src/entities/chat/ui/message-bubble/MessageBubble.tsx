import { formatMessageTime, getUnsupportedLabel } from "../../lib/format"
import type { TMessage } from "../../model/types"
import { MessageStatus } from "../message-status/MessageStatus"
import cls from "./MessageBubble.module.css"

type TMessageBubbleProps = {
  message: TMessage
  /** Последнее в серии подряд идущих от одного автора: у него «хвост» и отступ после */
  isLastInGroup: boolean
}

/**
 * Пузырь MAX: цвета из `--bubbles-*` по `data-bubbles-variant`, радиус 16,
 * угол «хвоста» 6. Время и галочки обтекаются текстом справа внизу.
 */
export function MessageBubble({ message, isLastInGroup }: TMessageBubbleProps) {
  const { content, direction, status, timestamp } = message
  const isText = content.type === "text"

  return (
    <div
      className={cls.row}
      data-direction={direction}
      data-last={isLastInGroup || undefined}
      data-bubbles-variant={direction}
    >
      <div className={cls.bubble}>
        <p className={cls.text} data-unsupported={!isText || undefined}>
          {isText ? content.text : getUnsupportedLabel(content.typeMessage)}
          <span className={cls.meta}>
            <time dateTime={new Date(timestamp * 1000).toISOString()}>
              {formatMessageTime(timestamp)}
            </time>
            {status && <MessageStatus status={status} />}
          </span>
        </p>
      </div>
    </div>
  )
}
