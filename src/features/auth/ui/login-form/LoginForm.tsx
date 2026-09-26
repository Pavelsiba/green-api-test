import { Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core"
import { type FormEvent, useState } from "react"
import * as z from "zod/mini"
import { getLoginErrorMessage } from "../../lib/get-login-error-message"
import { credentialsSchema } from "../../model/credentials-schema"
import { useLogin } from "../../model/hooks/use-login"
import cls from "./LoginForm.module.css"

type TFieldErrors = Partial<Record<keyof z.infer<typeof credentialsSchema>, string[]>>

/** В dev-сборке форма заполнена кредами из `.env`; в прод они не попадают */
const DEFAULT_VALUES = import.meta.env.DEV
  ? {
      apiUrl: import.meta.env.VITE_API_URL ?? "",
      idInstance: import.meta.env.VITE_ID_INSTANCE ?? "",
      apiTokenInstance: import.meta.env.VITE_API_TOKEN_INSTANCE ?? ""
    }
  : { apiUrl: "", idInstance: "", apiTokenInstance: "" }

/** Под каждым полем зарезервирована строка подсказки, ошибка встаёт в неё без сдвига соседей */
const FIELD_CLASS_NAMES = { root: cls.field, wrapper: cls.fieldWrapper, error: cls.fieldError }

const readField = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim()

export function LoginForm() {
  const { login, isPending, error, reset } = useLogin()
  const [fieldErrors, setFieldErrors] = useState<TFieldErrors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = credentialsSchema.safeParse({
      apiUrl: readField(formData, "apiUrl"),
      idInstance: readField(formData, "idInstance"),
      apiTokenInstance: readField(formData, "apiTokenInstance")
    })

    if (!result.success) {
      setFieldErrors(z.flattenError(result.error).fieldErrors)
      return
    }
    setFieldErrors({})
    login(result.data)
  }

  // новая правка полей убирает устаревшую ошибку сервера
  const handleChange = () => {
    if (error) reset()
  }

  return (
    <form className={cls.form} onSubmit={handleSubmit} onChange={handleChange} noValidate>
      <Stack gap={24}>
        <Stack gap={8}>
          <Title order={1} className={cls.title}>
            Вход в GREEN-API
          </Title>
          <p className={cls.subtitle}>
            Данные инстанса из{" "}
            <a
              className={cls.link}
              href="https://console.green-api.com"
              target="_blank"
              rel="noreferrer"
            >
              личного кабинета
            </a>
          </p>
        </Stack>

        <div>
          <Stack gap={8}>
            <TextInput
              name="apiUrl"
              label="apiUrl"
              placeholder="https://7201.api.green-api.com"
              defaultValue={DEFAULT_VALUES.apiUrl}
              error={fieldErrors.apiUrl?.[0]}
              autoComplete="url"
              required
              withAsterisk={false}
              classNames={FIELD_CLASS_NAMES}
            />
            <TextInput
              name="idInstance"
              label="idInstance"
              placeholder="7201234567"
              defaultValue={DEFAULT_VALUES.idInstance}
              error={fieldErrors.idInstance?.[0]}
              inputMode="numeric"
              autoComplete="username"
              required
              withAsterisk={false}
              classNames={FIELD_CLASS_NAMES}
            />
            <PasswordInput
              name="apiTokenInstance"
              label="apiTokenInstance"
              defaultValue={DEFAULT_VALUES.apiTokenInstance}
              error={fieldErrors.apiTokenInstance?.[0]}
              autoComplete="current-password"
              required
              withAsterisk={false}
              classNames={FIELD_CLASS_NAMES}
            />
          </Stack>

          {/* место под ошибку сервера занято всегда: кнопка не прыгает при её появлении */}
          <p className={cls.status} role="alert">
            {error ? getLoginErrorMessage(error) : null}
          </p>

          <Button
            type="submit"
            size="xl"
            radius="lg"
            className={cls.submit}
            loading={isPending}
            fullWidth
          >
            Войти
          </Button>
        </div>
      </Stack>
    </form>
  )
}
