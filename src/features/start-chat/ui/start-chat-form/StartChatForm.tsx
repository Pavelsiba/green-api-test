import { ActionIcon, Loader, TextInput } from "@mantine/core"
import { ArrowRight, Search } from "lucide-react"
import { type SubmitEvent, useState } from "react"
import { getStartChatErrorMessage } from "../../lib/get-start-chat-error-message"
import { normalizePhone, phoneSchema } from "../../lib/normalize-phone"
import { useStartChat } from "../../model/hooks/use-start-chat"
import cls from "./StartChatForm.module.css"

const INPUT_CLASS_NAMES = {
  root: cls.field,
  wrapper: cls.fieldWrapper,
  input: cls.input,
  error: cls.error
}

const ERROR_PROPS = { role: "alert" }

const parsePhone = (value: string) => phoneSchema.safeParse(normalizePhone(value))

/**
 * Поле «новый чат по номеру» над списком чатов, на месте поиска MAX. Номер нормализуется
 * и проверяется на клиенте до запроса. Строка под ошибку занята всегда — список не прыгает.
 */
export function StartChatForm() {
  const [value, setValue] = useState("")
  const [formatError, setFormatError] = useState<string | null>(null)
  const { startChat, isPending, error, reset } = useStartChat({ onStarted: () => setValue("") })

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = parsePhone(value)
    if (!result.success) {
      setFormatError(result.error.issues[0]?.message ?? null)
      return
    }
    setFormatError(null)
    startChat(result.data)
  }

  const handleChange = (next: string) => {
    setValue(next)
    setFormatError(null)
    if (error) reset()
  }

  const message = formatError ?? (error ? getStartChatErrorMessage(error) : null)

  return (
    <form className={cls.form} onSubmit={handleSubmit} noValidate>
      <TextInput
        classNames={INPUT_CLASS_NAMES}
        value={value}
        onChange={(event) => handleChange(event.currentTarget.value)}
        placeholder="Новый чат: номер телефона"
        aria-label="Номер телефона для нового чата"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        leftSection={<Search size={18} />}
        rightSection={
          isPending ? (
            <Loader size={18} role="status" aria-label="Проверяем номер" />
          ) : (
            value.trim() !== "" && (
              <ActionIcon type="submit" variant="subtle" radius="xl" aria-label="Открыть чат">
                <ArrowRight size={18} />
              </ActionIcon>
            )
          )
        }
        error={message}
        errorProps={ERROR_PROPS}
      />
    </form>
  )
}
