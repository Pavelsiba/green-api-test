import type { CSSProperties } from "react"
import { getInitials } from "../../lib/format"
import cls from "./ChatAvatar.module.css"

const AVATAR_COLORS = ["coral", "orange", "green", "sky", "violet"] as const

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

/** Аватар с инициалами: градиент из палитры MAX, цвет стабилен для чата — зависит только от chatId */
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
