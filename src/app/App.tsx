import { useCredentials, useLogoutOnUnauthorized } from "@/features/auth"
import { ChatPage } from "@/pages/chat"
import { LoginPage } from "@/pages/login"

export function App() {
  useLogoutOnUnauthorized()
  const credentials = useCredentials()
  return credentials ? <ChatPage /> : <LoginPage />
}
