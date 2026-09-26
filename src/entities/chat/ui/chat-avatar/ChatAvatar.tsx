import type { CSSProperties } from "react"
import { getInitials } from "../../lib/format"
import cls from "./ChatAvatar.module.css"

/** Палитра аватаров MAX: градиент между `--avatar-chat-<color>-step-1` и `-step-2` */
const AVATAR_COLORS = ["coral", "orange", "green", "sky", "violet"] as const

/** Цвет стабилен для чата: зависит только от chatId */
const getAvatarColor = (chatId: string) => {
  let hash = 0
  for (const char of chatId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

type TChatAvatarProps = {
  chatId: string
  title: string
  size?: number
}

export function ChatAvatar({ chatId, title, size = 52 }: TChatAvatarProps) {
  return (
    <span
      className={cls.avatar}
      data-color={getAvatarColor(chatId)}
      style={{ "--avatar-size": `${size}px` } as CSSProperties}
      aria-hidden
    >
      {getInitials(title)}
    </span>
  )
}
