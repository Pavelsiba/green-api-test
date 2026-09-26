import * as z from "zod/mini"

/**
 * Номер из поля ввода → цифры для checkWhatsapp. Российская запись с восьмёркой
 * (`8 900 …`) приводится к `7…`: так её пишут чаще, чем с +7.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "")
  return digits.length === 11 && digits.startsWith("8") ? `7${digits.slice(1)}` : digits
}

/** E.164: до 15 цифр с кодом страны; короче 10 — точно не полный номер */
export const phoneSchema = z
  .string()
  .check(z.regex(/^\d{10,15}$/, "Номер с кодом страны, например +7 900 123-45-67"))
