import { useAtomValue } from "jotai"
import { credentialsAtom } from "../credentials-atom"

/** Креды текущей сессии; `null` — пользователь не вошёл */
export const useCredentials = () => useAtomValue(credentialsAtom)
