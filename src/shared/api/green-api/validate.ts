import { en } from "zod/locales"
import * as z from "zod/mini"

z.config(en())

export type TValidated<T> = { ok: true; data: T } | { ok: false; reason: string }

/**
 * Проверка ответа по strict-схеме: контракт GREEN-API фиксирован. Любое расхождение — новое поле,
 * пропавшее поле, другой тип — это поломка контракта на стороне API: отказ с причиной для лога,
 * фронт под неизвестные данные не подстраивается.
 */
export function validate<TSchema extends z.ZodMiniType>(
  schema: TSchema,
  data: unknown,
  context: string
): TValidated<z.infer<TSchema>> {
  const parsed = schema.safeParse(data)
  if (parsed.success) return { ok: true, data: parsed.data }
  return { ok: false, reason: `[${context}] validation failed:\n${z.prettifyError(parsed.error)}` }
}
