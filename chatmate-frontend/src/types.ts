export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

export interface HistoryTurn {
  role: 'USER' | 'ASSISTANT'
  content: string
}

export interface ChatRequest {
  message: string
  history: HistoryTurn[]
}

export interface ChatResponse {
  reply: string
}
