/** Креды из `.env`: подставляются в форму входа только в dev-сборке */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_ID_INSTANCE?: string
  readonly VITE_API_TOKEN_INSTANCE?: string
}
