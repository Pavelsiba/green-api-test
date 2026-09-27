import { Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core"
import { type SubmitEvent, useState } from "react"
import * as z from "zod/mini"
import { getLoginErrorMessage } from "../../lib/get-login-error-message"
import { credentialsSchema } from "../../model/credentials-schema"
import { useLogin } from "../../model/hooks/use-login"
import cls from "./LoginForm.module.css"

type TCredentialsField = keyof z.infer<typeof credentialsSchema>
type TFieldErrors = Partial<Record<TCredentialsField, string[]>>

const FIELD_NAMES = {
  apiUrl: "apiUrl",
  idInstance: "idInstance",
  apiTokenInstance: "apiTokenInstance"
} as const satisfies { [TField in TCredentialsField]: TField }

const DEFAULT_VALUES = __IS_DEV__
  ? {
      apiUrl: __API_URL__,
      idInstance: __ID_INSTANCE__,
      apiTokenInstance: __API_TOKEN_INSTANCE__
    }
  : { apiUrl: "https://7201.api.green-api.com", idInstance: "", apiTokenInstance: "" }

const GREEN_API_CONSOLE_URL = "https://console.green-api.com"

const FIELD_CLASS_NAMES = { root: cls.field, wrapper: cls.fieldWrapper, error: cls.fieldError }

const readField = (formData: FormData, name: TCredentialsField) =>
  String(formData.get(name) ?? "").trim()

const parseCredentials = (form: HTMLFormElement) => {
  const formData = new FormData(form)
  return credentialsSchema.safeParse({
    apiUrl: readField(formData, FIELD_NAMES.apiUrl),
    idInstance: readField(formData, FIELD_NAMES.idInstance),
    apiTokenInstance: readField(formData, FIELD_NAMES.apiTokenInstance)
  })
}

/**
 * Форма входа по данным инстанса GREEN-API. Поля проверяются `credentialsSchema`, креды
 * сохраняются только после `getStateInstance` = `authorized` (`useLogin`). В dev поля заполнены
 * из `.env`. Под каждым полем и под ошибкой сервера место зарезервировано — форма не прыгает.
 */
export function LoginForm() {
  const { login, isPending, error, reset } = useLogin()
  const [fieldErrors, setFieldErrors] = useState<TFieldErrors>({})

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = parseCredentials(event.currentTarget)

    if (!result.success) {
      setFieldErrors(z.flattenError(result.error).fieldErrors)
      return
    }
    setFieldErrors({})
    login(result.data)
  }

  return (
    <form
      className={cls.form}
      onSubmit={handleSubmit}
      onChange={() => error instanceof Error && reset()}
      noValidate
    >
      <Stack gap={24}>
        <Stack gap={8}>
          <Title order={1} className={cls.title}>
            Вход в GREEN-API
          </Title>
          <p className={cls.subtitle}>
            Данные инстанса из{" "}
            <a className={cls.link} href={GREEN_API_CONSOLE_URL} target="_blank" rel="noreferrer">
              личного кабинета
            </a>
          </p>
        </Stack>

        <div>
          <Stack gap={8}>
            <TextInput
              name={FIELD_NAMES.apiUrl}
              label={FIELD_NAMES.apiUrl}
              defaultValue={DEFAULT_VALUES.apiUrl}
              error={fieldErrors.apiUrl?.[0]}
              autoComplete="url"
              required
              withAsterisk={false}
              classNames={FIELD_CLASS_NAMES}
            />
            <TextInput
              name={FIELD_NAMES.idInstance}
              label={FIELD_NAMES.idInstance}
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
              name={FIELD_NAMES.apiTokenInstance}
              label={FIELD_NAMES.apiTokenInstance}
              defaultValue={DEFAULT_VALUES.apiTokenInstance}
              error={fieldErrors.apiTokenInstance?.[0]}
              autoComplete="current-password"
              required
              withAsterisk={false}
              classNames={FIELD_CLASS_NAMES}
            />
          </Stack>

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
