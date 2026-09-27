import { atom } from "jotai"
import { chatIdFromHash, hashFromChatId } from "../lib/chat-hash"

const OPENED_BY_APP = "chatOpenedByApp"

const hashChatIdAtom = atom(readHashChatId())

hashChatIdAtom.onMount = (setChatId) => {
  const sync = () => setChatId(readHashChatId())
  window.addEventListener("popstate", sync)
  window.addEventListener("hashchange", sync)
  return () => {
    window.removeEventListener("popstate", sync)
    window.removeEventListener("hashchange", sync)
  }
}

function readHashChatId() {
  return chatIdFromHash(window.location.hash)
}

function urlWithoutHash() {
  return window.location.pathname + window.location.search
}

/**
 * Открытый чат; `null` — на мобильной ширине показывается список. Источник истины — hash URL
 * (`#79001234567`): чат переживает перезагрузку, а системная кнопка «назад» возвращает к списку.
 * Открытие из списка добавляет запись истории, переключение между чатами её заменяет,
 * закрытие снимает её через `history.back()` — или просто чистит hash, если чат открыт по ссылке.
 */
export const selectedChatIdAtom = atom(
  (get) => get(hashChatIdAtom),
  (get, set, chatId: string | null) => {
    const currentChatId = get(hashChatIdAtom)
    if (chatId === currentChatId) return
    set(hashChatIdAtom, chatId)

    if (chatId === null) {
      if (window.history.state?.[OPENED_BY_APP]) window.history.back()
      else window.history.replaceState(null, "", urlWithoutHash())
      return
    }

    const url = hashFromChatId(chatId)
    if (currentChatId === null) window.history.pushState({ [OPENED_BY_APP]: true }, "", url)
    else window.history.replaceState(window.history.state, "", url)
  }
)
