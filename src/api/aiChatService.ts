import request from './request'
import { API_BASE_URL } from './config'
import { AUTH_TOKEN_KEY } from '../auth/session'
import { refreshAccessToken } from './tokenRefresh'
import { handleUnauthorized } from './unauthorizedHandler'

export interface ConversationSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export async function listConversations(): Promise<ConversationSummary[]> {
  return request.get('/api/v1/ai/conversations')
}

export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  return request.get(`/api/v1/ai/conversations/${conversationId}/messages`)
}

interface StreamChatParams {
  conversationId?: string
  message: string
  imageUrl?: string
}

/**
 * Consumes POST /ai/chat/stream's SSE body directly via fetch -- axios
 * doesn't expose a readable response stream in the browser, and this is
 * the one place the app needs one. Each `data: {...}` line is one JSON
 * event: {delta} per text fragment while streaming, {done,
 * conversation_id} once the reply is persisted, or {error}. Retries once
 * on a 401 the same way request.ts's interceptor does for every other
 * call, since a raw fetch bypasses that interceptor entirely.
 */
export async function streamChat(
  { conversationId, message, imageUrl }: StreamChatParams,
  onDelta: (text: string) => void,
): Promise<{ conversationId: string }> {
  const send = (token: string | null) =>
    fetch(`${API_BASE_URL}/api/v1/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ conversation_id: conversationId, message, image_url: imageUrl }),
    })

  let res = await send(localStorage.getItem(AUTH_TOKEN_KEY))
  if (res.status === 401) {
    const token = await refreshAccessToken()
    if (!token) {
      handleUnauthorized()
      throw new Error('unauthorized')
    }
    res = await send(token)
  }
  if (!res.ok || !res.body) {
    throw new Error('ai chat stream request failed')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let conversationIdOut = conversationId ?? ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const raw of events) {
      const line = raw.trim()
      if (!line.startsWith('data: ')) continue
      const payload = JSON.parse(line.slice('data: '.length)) as {
        delta?: string
        done?: boolean
        conversation_id?: string
        error?: string
      }
      if (payload.delta) onDelta(payload.delta)
      if (payload.done && payload.conversation_id) conversationIdOut = payload.conversation_id
      if (payload.error) throw new Error(payload.error)
    }
  }

  return { conversationId: conversationIdOut }
}
