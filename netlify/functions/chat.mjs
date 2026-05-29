// Netlify Function: serverseitiger Proxy zu OpenRouter.
// Der API-Key bleibt in der Netlify-Env (OPENROUTER_API_KEY) und landet nie im Client.
// Spiegelt die Dev-Middleware aus vite.config.ts (openRouterProxy).

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export default async (req) => {
  if (req.method !== 'POST') {
    return json(405, { error: { kind: 'method', message: 'Only POST is allowed.' } })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'

  if (!apiKey || apiKey.startsWith('sk-or-...')) {
    return json(200, {
      error: { kind: 'auth', message: 'OPENROUTER_API_KEY is not configured on the server.' },
    })
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: { kind: 'parse', message: 'Invalid request body.' } })
  }

  const body = {
    model,
    temperature: payload.temperature ?? 0.5,
    max_tokens: payload.max_tokens ?? 1100,
    messages: payload.messages ?? [],
  }
  if (payload.web) {
    body.plugins = [{ id: 'web', max_results: 3 }]
  }

  let upstream
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://kenergy-solutions.de',
        'X-Title': 'Frag dein Zuhause',
      },
      body: JSON.stringify(body),
    })
  } catch {
    return json(200, { error: { kind: 'network', message: 'Connection to OpenRouter failed.' } })
  }

  if (upstream.status === 401) return json(200, { error: { kind: 'auth', message: 'OpenRouter API key is invalid.' } })
  if (upstream.status === 429) {
    const retry = parseInt(upstream.headers.get('retry-after') || '20', 10)
    return json(200, { error: { kind: 'rate', message: 'Rate limit reached. Please wait a moment.', retryAfter: retry } })
  }
  if (!upstream.ok) {
    const raw = await upstream.text().catch(() => '')
    return json(200, { error: { kind: 'other', message: `OpenRouter error ${upstream.status}`, raw } })
  }

  const data = await upstream.json().catch(() => null)
  const msg = data?.choices?.[0]?.message
  let content = msg?.content ?? ''

  if (payload.web && Array.isArray(msg?.annotations)) {
    const urls = []
    for (const a of msg.annotations) {
      const u = a?.type === 'url_citation' ? a?.url_citation?.url : null
      if (u && !urls.includes(u)) urls.push(u)
      if (urls.length >= 3) break
    }
    if (urls.length > 0 && !content.includes(urls[0])) {
      content += '\n\nSources:\n' + urls.map((u) => `• ${u}`).join('\n')
    }
  }

  return json(200, { content })
}
