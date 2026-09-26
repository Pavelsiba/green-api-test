import { ActionIcon, Textarea } from "@mantine/core"
import { SendHorizontal } from "lucide-react"
import { type FormEvent, type KeyboardEvent, useState } from "react"
import { useSendMessage } from "../../model/hooks/use-send-message"
import cls from "./MessageComposer.module.css"

type TMessageComposerProps = {
  chatId: string
  /** Пока история не загружена, оптимистичному сообщению некуда встать */
  disabled?: boolean
}

/** Плавающая панель ввода MAX: карточка с тенью, радиус 16, кнопка отправки справа */
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  // Enter — отправить, Shift+Enter — перенос; во время набора через IME Enter подтверждает слово
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    submit()
  }

  return (
    <form className={cls.composer} onSubmit={handleSubmit}>
      <Textarea
        className={cls.field}
        classNames={{ input: cls.input }}
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
