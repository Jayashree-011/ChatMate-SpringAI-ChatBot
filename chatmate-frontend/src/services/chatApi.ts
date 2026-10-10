import type { ChatRequest, ChatResponse } from '../types'

export async function sendMessage(request: ChatRequest): Promise<string> {
  let response: Response
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch {
    throw new Error('Could not reach ChatMate. Check that the backend is running and try again.')
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : 'The server could not process your message. Please try again.'
    throw new Error(message)
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('reply' in payload) ||
    typeof (payload as ChatResponse).reply !== 'string' ||
    !(payload as ChatResponse).reply.trim()
  ) {
    throw new Error('ChatMate received an invalid response. Please try again.')
  }
  return (payload as ChatResponse).reply
}
