import { atom } from "jotai"

/** Открытый чат; `null` — на мобильной ширине показывается список */
export const selectedChatIdAtom = atom<string | null>(null)
