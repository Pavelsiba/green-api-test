import { formatListTime, getChatTitle, getUnsupportedLabel } from "../../lib/format"
import type { TChatPreview, TMessage } from "../../model/types"
import { ChatAvatar } from "../chat-avatar/ChatAvatar"
import { MessageStatus } from "../message-status/MessageStatus"
import cls from "./ChatListItem.module.css"

const getPreviewText = (message: TMessage | null) => {
  if (!message) return "Нет сообщений"
  return message.content.type === "text"
    ? message.content.text
    : getUnsupportedLabel(message.content.typeMessage)
}

type TChatListItemProps = {
  chat: TChatPreview
  selected: boolean
  onSelect: (chatId: string) => void
}

/** Строка списка чатов MAX: аватар 52px, имя, последнее сообщение, время, непрочитанные */
export function ChatListItem({ chat, selected, onSelect }: TChatListItemProps) {
  const title = getChatTitle(chat)
  const { lastMessage, unreadCount } = chat

  return (
    <button
      type="button"
      className={cls.item}
      data-selected={selected || undefined}
      aria-current={selected || undefined}
      onClick={() => onSelect(chat.chatId)}
    >
      <ChatAvatar chatId={chat.chatId} title={title} />
      <span className={cls.title}>{title}</span>
      <span className={cls.time}>{lastMessage && formatListTime(lastMessage.timestamp)}</span>
      <span className={cls.text} data-empty={!lastMessage || undefined}>
        {lastMessage?.status && <MessageStatus status={lastMessage.status} />}
        <span className={cls.textContent}>{getPreviewText(lastMessage)}</span>
      </span>
      {unreadCount > 0 && (
        <span className={cls.unread}>
          <span className={cls.visuallyHidden}>Непрочитанных: </span>
          {unreadCount}
        </span>
      )}
    </button>
  )
}
