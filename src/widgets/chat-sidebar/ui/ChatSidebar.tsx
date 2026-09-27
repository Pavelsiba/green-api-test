import { Button, Loader } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import {
  ChatListItem,
  chatListQueryOptions,
  useSelectChat,
  useSelectedChatId
} from "@/entities/chat"
import { LogoutButton } from "@/features/auth"
import { StartChatForm } from "@/features/start-chat"
import { ThemeSwitcher } from "@/features/theme-switcher"
import { isFocusLost } from "@/shared/lib"
import cls from "./ChatSidebar.module.css"

function ChatList() {
  const { data: chats, isPending, isError, refetch } = useQuery(chatListQueryOptions())
  const selectedChatId = useSelectedChatId()
  const selectChat = useSelectChat()
  const listRef = useRef<HTMLElement>(null)
  const lastSelectedRef = useRef(selectedChatId)

  useEffect(() => {
    const previousChatId = lastSelectedRef.current
    lastSelectedRef.current = selectedChatId
    if (selectedChatId || !previousChatId || !isFocusLost()) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-chat-id="${CSS.escape(previousChatId)}"]`)
      ?.focus()
  }, [selectedChatId])

  if (isPending) {
    return (
      <div className={cls.state}>
        <Loader size="sm" role="status" aria-label="Загрузка чатов" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={cls.state}>
        <p>Не удалось загрузить чаты</p>
        <Button variant="light" size="sm" onClick={() => refetch()}>
          Повторить
        </Button>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className={cls.state}>
        <p>За неделю переписки не было. Введите номер выше, чтобы начать чат</p>
      </div>
    )
  }

  return (
    <nav ref={listRef} className={cls.list} aria-label="Чаты">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.chatId}
          chat={chat}
          selected={chat.chatId === selectedChatId}
          onSelect={selectChat}
        />
      ))}
    </nav>
  )
}

/**
 * Левая колонка MAX: заголовок, поле нового чата, список чатов. На узкой ширине после «назад»
 * потерянный фокус возвращается на строку чата, из которого вышли.
 */
export function ChatSidebar() {
  return (
    <aside className={cls.sidebar}>
      <header className={cls.header}>
        <h1 className={cls.title}>Чаты</h1>
        <div className={cls.actions}>
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </header>
      <StartChatForm />
      <ChatList />
    </aside>
  )
}
