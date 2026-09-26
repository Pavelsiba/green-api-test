import { useSelectedChatId } from "@/entities/chat"
import { useNotificationPolling } from "@/features/receive-messages"
import { ChatSidebar } from "@/widgets/chat-sidebar"
import { ChatWindow, ChatWindowPlaceholder } from "@/widgets/chat-window"
import cls from "./ChatPage.module.css"

/**
 * Две колонки MAX: список 420px и чат. На ширине меньше 926px — один экран:
 * список, пока чат не выбран, иначе чат с кнопкой «назад».
 */
export function ChatPage() {
  useNotificationPolling()
  const selectedChatId = useSelectedChatId()

  return (
    <main className={cls.page} data-view={selectedChatId ? "chat" : "list"}>
      <div className={cls.sidebar}>
        <ChatSidebar />
      </div>
      <div className={cls.window}>
        {selectedChatId ? (
          <ChatWindow key={selectedChatId} chatId={selectedChatId} />
        ) : (
          <ChatWindowPlaceholder />
        )}
      </div>
    </main>
  )
}
