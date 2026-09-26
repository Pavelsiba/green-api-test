import { atomWithStorage, createJSONStorage } from "jotai/utils"
import { setCredentials, type TCredentials } from "@/shared/api"
import { credentialsSchema } from "./credentials-schema"

type TStoredCredentials = TCredentials | null

// jotai 3 не экспортирует SyncStorage; последняя перегрузка createJSONStorage — синхронная
type TSyncStorage<TValue> = ReturnType<typeof createJSONStorage<TValue>>

const STORAGE_KEY = "green-api-credentials"

const jsonStorage = createJSONStorage<unknown>(() => localStorage)

/** Битые или устаревшие данные в localStorage — это «не вошёл», а не падение приложения */
const parseStored = (value: unknown): TStoredCredentials => {
  if (value === null) return null
  const result = credentialsSchema.safeParse(value)
  if (!result.success) console.warn("Stored credentials are invalid and were ignored")
  return result.success ? result.data : null
}

/**
 * Каждое чтение и запись заодно передаёт креды транспорту. С `getOnInit` первое чтение
 * происходит при импорте модуля, так что `greenApiInstance` знает креды до первого рендера.
 */
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
  // вход или выход в соседней вкладке
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

/** Креды текущей сессии; `null` — показать экран входа */
export const credentialsAtom = atomWithStorage<TStoredCredentials>(
  STORAGE_KEY,
  null,
  transportSyncedStorage,
  { getOnInit: true }
)
