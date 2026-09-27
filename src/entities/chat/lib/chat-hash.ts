const CHAT_SUFFIX = "@c.us"
const PHONE_PATTERN = /^\d{5,15}$/

/** `#79001234567` → `79001234567@c.us`; пустой или чужой hash — чат не выбран */
export function chatIdFromHash(hash: string): string | null {
  const phone = hash.replace(/^#/, "")
  return PHONE_PATTERN.test(phone) ? `${phone}${CHAT_SUFFIX}` : null
}

/** `79001234567@c.us` → `#79001234567` */
export function hashFromChatId(chatId: string): string {
  return `#${chatId.replace(CHAT_SUFFIX, "")}`
}
