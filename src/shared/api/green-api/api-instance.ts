import type * as z from "zod/mini"
import { ApiError, getHttpError } from "./api-error"
import type { TCredentials } from "./schemas"
import { validate } from "./validate"

let currentCredentials: TCredentials | null = null

export const setCredentials = (credentials: TCredentials | null) => {
  currentCredentials = credentials
}

type TApiInit<TSchema extends z.ZodMiniType> = Omit<RequestInit, "body" | "credentials"> & {
  schema: TSchema
  json?: unknown
  path?: string
  auth?: TCredentials
  allowEmpty?: boolean
}

/**
 * Запрос к `{apiUrl}/waInstance{id}/{method}/{token}`: креды из `setCredentials` или явный
 * `auth` (проверка на экране входа), ответ проверяется схемой, ошибки — `ApiError`.
 * `allowEmpty` — пустая очередь уведомлений. `AbortError` пробрасывается как есть.
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
  { schema, json, path = "", auth, allowEmpty, ...init }: TApiInit<TSchema>
): Promise<z.infer<TSchema> | null> {
  const credentials = auth ?? currentCredentials
  if (!credentials) throw new ApiError({ kind: "unauthorized" })

  const { apiUrl, idInstance, apiTokenInstance } = credentials
  const url = `${apiUrl.replace(/\/+$/, "")}/waInstance${idInstance}/${method}/${apiTokenInstance}${path}`
  const headers =
    json === undefined ? init.headers : { "Content-Type": "application/json", ...init.headers }
  const body = json === undefined ? undefined : JSON.stringify(json)

  let response: Response
  let text: string
  try {
    response = await fetch(url, { ...init, headers, body })
    text = await response.text()
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error
    throw new ApiError({
      kind: "network",
      message: error instanceof Error ? error.message : String(error)
    })
  }

  const data = parseJson(text)

  if (!response.ok) throw new ApiError(getHttpError(response.status, getErrorMessage(data, text)))
  if (data === undefined) throw new ApiError({ kind: "badResponse", message: text.slice(0, 200) })
  if (isRejected(data)) throw new ApiError({ kind: "rejected", reason: data.reason })
  if (data === null) {
    if (allowEmpty) return null
    throw new ApiError({ kind: "badResponse", message: `[${method}] empty body` })
  }

  const result = validate(schema, data, method)
  if (!result.ok) throw new ApiError({ kind: "badResponse", message: result.reason })
  return result.data
}

function parseJson(text: string): unknown {
  if (text.trim() === "") return null
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function isRejected(data: unknown): data is { status: false; reason: string } {
  return typeof data === "object" && data !== null && "status" in data && data.status === false
}

function getErrorMessage(data: unknown, text: string): string {
  return typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
    ? data.message
    : text.slice(0, 200)
}
