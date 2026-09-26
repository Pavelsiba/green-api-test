import { ActionIcon, Button, Loader } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import {
  ChatAvatar,
  chatHistoryQueryOptions,
  chatListQueryOptions,
  DaySeparator,
  formatPhone,
  getChatTitle,
  MessageBubble,
  useSelectChat
} from "@/entities/chat"
import { MessageComposer } from "@/features/send-message"
import { buildFeed } from "../lib/build-feed"
import { useStickToBottom } from "../model/hooks/use-stick-to-bottom"
import cls from "./ChatWindow.module.css"

function ChatHeader({ chatId }: { chatId: string }) {
  const selectChat = useSelectChat()
  const { data: chat } = useQuery({
    ...chatListQueryOptions(),
    select: (chats) => chats.find((item) => item.chatId === chatId)
  })
  const title = getChatTitle({ chatId, name: chat?.name ?? null })
  const phone = formatPhone(chatId)

  return (
    <header className={cls.header}>
      <ActionIcon
        className={cls.back}
        variant="subtle"
        color="gray"
        size={40}
        radius="xl"
        onClick={() => selectChat(null)}
        aria-label="Назад к чатам"
      >
        <ArrowLeft size={22} />
      </ActionIcon>
      <ChatAvatar chatId={chatId} title={title} size={40} />
      <div className={cls.headerText}>
        <h2 className={cls.headerTitle}>{title}</h2>
        {title !== phone && <p className={cls.headerSubtitle}>{phone}</p>}
      </div>
    </header>
  )
}

function MessageFeed({ chatId }: { chatId: string }) {
  const { data: messages, isPending, isError, refetch } = useQuery(chatHistoryQueryOptions(chatId))
  const lastMessage = messages?.at(-1)
  const { scrollRef, handleScroll } = useStickToBottom({
    chatId,
    messageCount: messages?.length ?? 0,
    lastIsOwnSending: lastMessage?.status === "sending"
  })

  if (isPending) {
    return (
      <div className={cls.state}>
        <Loader size="sm" color="white" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={cls.state}>
        <p className={cls.capsuleText}>Не удалось загрузить историю</p>
        <Button size="sm" onClick={() => refetch()}>
          Повторить
        </Button>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className={cls.state}>
        <p className={cls.capsuleText}>Сообщений пока нет. Напишите первым</p>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className={cls.scroll}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Сообщения"
    >
      <div className={cls.feed}>
        {buildFeed(messages).map((item) =>
          item.type === "day" ? (
            <DaySeparator key={item.key} timestamp={item.timestamp} />
          ) : (
            <MessageBubble
              key={item.key}
              message={item.message}
              isLastInGroup={item.isLastInGroup}
            />
          )
        )}
      </div>
    </div>
  )
}

/** Правая часть MAX: шапка 64px, лента на фоне чата, плавающая панель ввода */
export function ChatWindow({ chatId }: { chatId: string }) {
  const { isSuccess } = useQuery(chatHistoryQueryOptions(chatId))

  return (
    <section className={cls.window} aria-label="Чат">
      <ChatHeader chatId={chatId} />
      <MessageFeed chatId={chatId} />
      <div className={cls.composer}>
        <MessageComposer key={chatId} chatId={chatId} disabled={!isSuccess} />
      </div>
    </section>
  )
}

/** Чат не выбран: подсказка на фоне чата */
export function ChatWindowPlaceholder() {
  return (
    <section className={cls.window}>
      <div className={cls.state}>
        <p className={cls.capsuleText}>Выберите чат или начните новый по номеру телефона</p>
      </div>
    </section>
  )
}
