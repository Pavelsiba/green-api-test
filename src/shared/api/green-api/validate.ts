import { en } from "zod/locales"
import * as z from "zod/mini"

// zod/mini не несёт текстов ошибок («Invalid input»); локаль нужна для z.prettifyError
z.config(en())

type TIssue = z.core.$ZodIssue

export type TValidated<T> = { ok: true; data: T } | { ok: false; reason: string }

/**
 * Гибридная проверка по strict-схеме.
 * - Только лишние ключи: сервер добавил поле, которое мы не читаем. Warn и пропускаем данные.
 * - Нет поля или не тот тип: данные испортят состояние. Отказ.
 */
export function validate<TSchema extends z.ZodMiniType>(
  schema: TSchema,
  data: unknown,
  context: string
): TValidated<z.infer<TSchema>> {
  const parsed = schema.safeParse(data)
  if (parsed.success) return { ok: true, data: parsed.data }

  const message = z.prettifyError(parsed.error)
  if (hasOnlyExtraKeys(parsed.error.issues)) {
    console.warn(`[${context}] schema drift, extra keys passed through:\n${message}`)
    return { ok: true, data: data as z.infer<TSchema> }
  }
  return { ok: false, reason: `[${context}] validation failed:\n${message}` }
}

/** Объединение проходит, если хотя бы одна ветка упала только на лишних ключах. */
function hasOnlyExtraKeys(issues: readonly TIssue[]): boolean {
  return issues.every(
    (issue) =>
      issue.code === "unrecognized_keys" ||
      (issue.code === "invalid_union" && issue.errors.some(hasOnlyExtraKeys))
  )
}
