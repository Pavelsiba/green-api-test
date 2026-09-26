import { useAtomValue } from "jotai"
import { selectedChatIdAtom } from "../selected-chat-atom"

export const useSelectedChatId = () => useAtomValue(selectedChatIdAtom)
