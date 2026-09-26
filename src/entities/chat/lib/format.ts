const RU_PHONE = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/

/** `79001234567@c.us` → `+7 900 123-45-67`; иностранные номера — просто `+` и цифры */
export function formatPhone(chatId: string): string {
  const digits = chatId.replace(/@.*$/, "")
  const match = RU_PHONE.exec(digits)
  return match ? `+7 ${match[1]} ${match[2]}-${match[3]}-${match[4]}` : `+${digits}`
}

export const getChatTitle = ({ chatId, name }: { chatId: string; name: string | null }) =>
  name || formatPhone(chatId)

/** Буквы для аватара: две первые буквы имени, для номера — две последние цифры */
export function getInitials(title: string): string {
  const words = title.match(/\p{L}+/gu)
  if (!words) return title.replace(/\D/g, "").slice(-2)
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")
}

const timeFormat = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" })
const dayMonthFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" })
const fullDateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric"
})
const shortDateFormat = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" })

const toDate = (timestamp: number) => new Date(timestamp * 1000)

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

const DAY_MS = 86_400_000

/** Разница в календарных днях между `timestamp` и `now`: 0 — сегодня, 1 — вчера */
const daysAgo = (timestamp: number, now: Date) =>
  Math.round((startOfDay(now) - startOfDay(toDate(timestamp))) / DAY_MS)

/** Время в пузыре: `14:05` */
export const formatMessageTime = (timestamp: number) => timeFormat.format(toDate(timestamp))

/** Время в списке чатов: сегодня — `14:05`, раньше — `24.09` */
export const formatListTime = (timestamp: number, now = new Date()) =>
  daysAgo(timestamp, now) === 0
    ? formatMessageTime(timestamp)
    : shortDateFormat.format(toDate(timestamp))

const RELATIVE_DAY_LABELS: Record<number, string> = { 0: "Сегодня", 1: "Вчера" }

/** Разделитель дней в ленте: `Сегодня`, `Вчера`, `24 сентября`, `3 марта 2025` */
export function formatDayLabel(timestamp: number, now = new Date()): string {
  const date = toDate(timestamp)
  const relative = RELATIVE_DAY_LABELS[daysAgo(timestamp, now)]
  if (relative) return relative
  return date.getFullYear() === now.getFullYear()
    ? dayMonthFormat.format(date)
    : fullDateFormat.format(date).replace(/\s*г\.$/, "")
}

/** Ключ дня для группировки ленты */
export const getDayKey = (timestamp: number) => startOfDay(toDate(timestamp))

const UNSUPPORTED_LABELS: Record<string, string> = {
  imageMessage: "Фото",
  videoMessage: "Видео",
  audioMessage: "Голосовое сообщение",
  documentMessage: "Документ",
  stickerMessage: "Стикер",
  locationMessage: "Геопозиция",
  contactMessage: "Контакт",
  pollMessage: "Опрос",
  reactionMessage: "Реакция"
}

/** Подпись для сообщения, которое чат не отображает */
export const getUnsupportedLabel = (typeMessage: string) =>
  UNSUPPORTED_LABELS[typeMessage] ?? "Сообщение этого типа не поддерживается"
