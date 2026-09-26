import { useCredentials } from "@/features/auth"
import { ChatPage } from "@/pages/chat"
import { LoginPage } from "@/pages/login"

export function App() {
  const credentials = useCredentials()
  return credentials ? <ChatPage /> : <LoginPage />
}
