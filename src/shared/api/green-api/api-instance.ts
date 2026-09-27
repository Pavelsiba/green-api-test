import type * as z from "zod/mini"
import { request } from "../http"
import { createApiError, getHttpError } from "./api-error"
import { errorBodySchema, rejectedResponseSchema, type TCredentials } from "./schemas"
import { validate } from "./validate"

type TApiInit<TSchema extends z.ZodMiniType> = Omit<RequestInit, "body" | "credentials"> & {
  schema: TSchema
  json?: unknown
  path?: string
  auth?: TCredentials
  allowEmpty?: boolean
}

const ERROR_TEXT_LENGTH = 200

let currentCredentials: TCredentials | null = null

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError"

async function send(url: string, init: Parameters<typeof request>[1]) {
  try {
    return await request(url, init)
  } catch (error) {
    if (isAbortError(error)) throw error
    throw createApiError({
      kind: "network",
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

export const setCredentials = (credentials: TCredentials | null) => {
  currentCredentials = credentials
}

/**
 * Запрос к методу GREEN-API `{apiUrl}/waInstance{id}/{method}/{token}` поверх общего HTTP-слоя
 * (`shared/api/http`). Креды из `setCredentials` или явный `auth` (проверка на экране входа).
 * Ошибки HTTP и сети — `AppError` источника `api` с видом по статусу; отказ `{ status: false }` при
 * HTTP 200 — `rejected`; пустое тело допустимо только с `allowEmpty` (пустая очередь уведомлений);
 * ответ проверяется схемой. `AbortError` пробрасывается как есть.
 */
export async function greenApiInstance<TSchema extends z.ZodMiniType>(
  method: string,
  init: TApiInit<TSchema> & { allowEmpty: true }
): Promise<z.infer<TSchema> | null>
export async function greenApiInstance<TSchema extends z.ZodMiniType>(
  method: string,
  init: TApiInit<TSchema>
): Promise<z.infer<TSchema>>
export async function greenApiInstance<TSchema extends z.ZodMiniType>(
  method: string,
  { schema, path = "", auth, allowEmpty, ...init }: TApiInit<TSchema>
): Promise<z.infer<TSchema> | null> {
  const credentials = auth ?? currentCredentials
  if (!credentials) throw createApiError({ kind: "unauthorized" })

  const { apiUrl, idInstance, apiTokenInstance } = credentials
  const url = `${apiUrl.replace(/\/+$/, "")}/waInstance${idInstance}/${method}/${apiTokenInstance}${path}`
  const { ok, status, body, text } = await send(url, init)

  if (!ok) {
    const message =
      errorBodySchema.safeParse(body).data?.message ?? text.slice(0, ERROR_TEXT_LENGTH)
    throw createApiError(getHttpError(status, message))
  }

  if (body === undefined) {
    throw createApiError({ kind: "badResponse", message: text.slice(0, ERROR_TEXT_LENGTH) })
  }
  const rejected = rejectedResponseSchema.safeParse(body)
  if (rejected.success) throw createApiError({ kind: "rejected", reason: rejected.data.reason })
  if (body === null) {
    if (allowEmpty) return null
    throw createApiError({ kind: "badResponse", message: `[${method}] empty body` })
  }

  const result = validate(schema, body, method)
  if (!result.ok) {
    console.error(result.reason)
    throw createApiError({ kind: "badResponse", message: result.reason })
  }
  return result.data
}
