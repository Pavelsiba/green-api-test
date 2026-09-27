// Константы подставляет `define` в vite.config.ts

/** `true` только в `vite dev` (mode development) */
declare const __IS_DEV__: boolean

/** Креды из `.env` для автозаполнения формы входа; вне dev — пустые строки */
declare const __API_URL__: string
declare const __ID_INSTANCE__: string
declare const __API_TOKEN_INSTANCE__: string
