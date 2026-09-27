type THttpResponse = { status: number; ok: boolean; body: unknown; text: string }

type TRequestInit = Omit<RequestInit, "body"> & { json?: unknown }

function parseJson(text: string): unknown {
  if (text.trim() === "") return null
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/**
 * HTTP-запрос поверх `fetch`, без знания о конкретном API и без своих ошибок. `json`
 * сериализуется в тело с `Content-Type: application/json`. Ответ — статус и прочитанное тело:
 * `body` — разобранный JSON, `null` при пустом теле, `undefined`, если тело не JSON. Что считать
 * ошибкой, решает вызывающий; исключения самого `fetch` (сбой сети, `AbortError`) проходят как есть.
 */
export async function request(
  url: string,
  { json, ...init }: TRequestInit = {}
): Promise<THttpResponse> {
  const headers =
    json === undefined ? init.headers : { "Content-Type": "application/json", ...init.headers }
  const body = json === undefined ? undefined : JSON.stringify(json)
  const response = await fetch(url, { ...init, headers, body })
  const text = await response.text()
  return { status: response.status, ok: response.ok, body: parseJson(text), text }
}
