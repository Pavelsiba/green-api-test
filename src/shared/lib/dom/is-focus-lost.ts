/**
 * Фокус потерян: он на `body` или на элементе, который скрыли (например, при переключении
 * экранов на узкой ширине). Тогда его нужно перенести на видимый элемент вручную.
 */
export function isFocusLost(): boolean {
  const active = document.activeElement
  if (!(active instanceof HTMLElement) || active === document.body) return true
  return typeof active.checkVisibility === "function" && !active.checkVisibility()
}
