import { atomWithStorage, createJSONStorage } from "jotai/utils"
import { setCredentials, type TCredentials } from "@/shared/api"
import { credentialsSchema } from "./credentials-schema"

type TStoredCredentials = TCredentials | null

type TSyncStorage<TValue> = ReturnType<typeof createJSONStorage<TValue>>

const STORAGE_KEY = "green-api-credentials"

const jsonStorage = createJSONStorage<unknown>(() => localStorage)

const transportSyncedStorage: TSyncStorage<TStoredCredentials> = {
  getItem: (key) => {
    const credentials = parseStored(jsonStorage.getItem(key, null))
    setCredentials(credentials)
    return credentials
  },
  setItem: (key, credentials) => {
    setCredentials(credentials)
    jsonStorage.setItem(key, credentials)
  },
  removeItem: (key) => {
    setCredentials(null)
    jsonStorage.removeItem(key)
  },
  subscribe: (key, callback) =>
    jsonStorage.subscribe?.(
      key,
      (value) => {
        const credentials = parseStored(value)
        setCredentials(credentials)
        callback(credentials)
      },
      null
    )
}

const parseStored = (value: unknown): TStoredCredentials => {
  if (value === null) return null
  const result = credentialsSchema.safeParse(value)
  if (!result.success) console.warn("Stored credentials are invalid and were ignored")
  return result.success ? result.data : null
}

/**
 * Креды текущей сессии в localStorage; `null` — показать экран входа. Каждое чтение и запись
 * заодно передаёт креды транспорту (`setCredentials`); с `getOnInit` первое чтение идёт при
 * импорте модуля, так что транспорт знает креды до первого рендера. Битые данные в хранилище —
 * «не вошёл». Вход и выход в соседней вкладке приходят через `subscribe`.
 */
export const credentialsAtom = atomWithStorage<TStoredCredentials>(
  STORAGE_KEY,
  null,
  transportSyncedStorage,
  { getOnInit: true }
)
