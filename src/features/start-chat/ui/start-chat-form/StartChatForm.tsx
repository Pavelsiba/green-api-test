import { ActionIcon, Loader, TextInput } from "@mantine/core"
import { ArrowRight, Search } from "lucide-react"
import { type FormEvent, useState } from "react"
import { getStartChatErrorMessage } from "../../lib/get-start-chat-error-message"
import { normalizePhone, phoneSchema } from "../../lib/normalize-phone"
import { useStartChat } from "../../model/hooks/use-start-chat"
import cls from "./StartChatForm.module.css"

/** Поле «новый чат по номеру» над списком, на месте поиска MAX */
export function StartChatForm() {
  const [value, setValue] = useState("")
  const [formatError, setFormatError] = useState<string | null>(null)
  const { startChat, isPending, error, reset } = useStartChat({ onStarted: () => setValue("") })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = phoneSchema.safeParse(normalizePhone(value))
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
        classNames={{ input: cls.input }}
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
            <Loader size={18} />
          ) : (
            value.trim() !== "" && (
              <ActionIcon type="submit" variant="subtle" radius="xl" aria-label="Открыть чат">
                <ArrowRight size={18} />
              </ActionIcon>
            )
          )
        }
        error={Boolean(message)}
      />
      {/* строка под ошибку занята всегда: список под формой не прыгает */}
      <p className={cls.error} role="alert">
        {message}
      </p>
    </form>
  )
}
