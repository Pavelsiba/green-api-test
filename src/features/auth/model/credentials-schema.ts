import * as z from "zod/mini"

/** Креды из формы входа и из localStorage; сообщения показываются пользователю под полями */
export const credentialsSchema = z.strictObject({
  apiUrl: z.url({ protocol: /^https?$/, error: "Адрес вида https://7201.api.green-api.com" }),
  idInstance: z
    .string()
    .check(
      z.minLength(1, "Укажите idInstance"),
      z.regex(/^\d+$/, "Только цифры, например 7201234567")
    ),
  apiTokenInstance: z.string().check(z.minLength(1, "Укажите токен инстанса"))
})
