const CHAT_SUFFIX = "@c.us"
const PHONE_PATTERN = /^\d{5,15}$/

/** Hash URL ↔ chatId: `#79001234567` ↔ `79001234567@c.us`; hash не из 5–15 цифр — чат не выбран */
export function chatIdFromHash(hash: string): string | null {
  const phone = hash.replace(/^#/, "")
  return PHONE_PATTERN.test(phone) ? `${phone}${CHAT_SUFFIX}` : null
}

export function hashFromChatId(chatId: string): string {
  return `#${chatId.replace(CHAT_SUFFIX, "")}`
}
