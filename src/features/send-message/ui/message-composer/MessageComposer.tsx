import { ActionIcon, Textarea } from "@mantine/core"
import { SendHorizontal } from "lucide-react"
import { type KeyboardEvent, type SubmitEvent, useState } from "react"
import { useSendMessage } from "../../model/hooks/use-send-message"
import cls from "./MessageComposer.module.css"

type TMessageComposerProps = {
  chatId: string
  disabled?: boolean
}

const TEXTAREA_CLASS_NAMES = { input: cls.input }

const isSendKey = (event: KeyboardEvent<HTMLTextAreaElement>) =>
  event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing

/**
 * Плавающая панель ввода в стиле MAX: карточка с тенью, кнопка отправки справа. Enter отправляет,
 * Shift+Enter переносит строку, Enter во время набора через IME подтверждает слово. `disabled` —
 * пока история чата не загружена: оптимистичному сообщению некуда встать.
 */
export function MessageComposer({ chatId, disabled = false }: TMessageComposerProps) {
  const { send } = useSendMessage()
  const [text, setText] = useState("")
  const trimmed = text.trim()
  const canSend = !disabled && trimmed !== ""

  const submit = () => {
    if (!canSend) return
    send(chatId, trimmed)
    setText("")
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSendKey(event)) return
    event.preventDefault()
    submit()
  }

  return (
    <form className={cls.composer} onSubmit={handleSubmit}>
      <Textarea
        className={cls.field}
        classNames={TEXTAREA_CLASS_NAMES}
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder="Сообщение"
        aria-label="Сообщение"
        autosize
        minRows={1}
        maxRows={6}
        disabled={disabled}
      />
      <ActionIcon
        type="submit"
        className={cls.send}
        size={40}
        radius="xl"
        disabled={!canSend}
        aria-label="Отправить"
      >
        <SendHorizontal size={20} />
      </ActionIcon>
    </form>
  )
}
