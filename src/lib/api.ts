import type { ChatApiResult } from './types'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CallOptions {
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
  // Live-Websuche aktivieren (Förderungen, Preise, lokale Betriebe).
  web?: boolean
}

// Ruft den serverseitigen OpenRouter-Proxy auf (/api/chat). Der API-Key bleibt im Server.
export async function callHouse(
  messages: ChatMessage[],
  opts: CallOptions = {},
): Promise<ChatApiResult> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        temperature: opts.temperature ?? 0.6,
        max_tokens: opts.maxTokens ?? 600,
        web: opts.web ?? false,
      }),
      signal: opts.signal,
    })
    const data = (await res.json()) as ChatApiResult
    return data
  } catch {
    return { error: { kind: 'network', message: 'No connection to the server.' } }
  }
}
