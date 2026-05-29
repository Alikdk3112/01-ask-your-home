import { defineConfig, loadEnv, type Plugin, type Connect } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => {
      raw += c
      if (raw.length > 1_000_000) reject(new Error('Body too large'))
    })
    req.on('end', () => resolve(raw))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(body)
}

/**
 * Serverseitiger Proxy zu OpenRouter. Der API-Key bleibt im Node-Prozess
 * (aus .env) und wird nie ins Client-Bundle gebündelt.
 */
function openRouterProxy(env: Record<string, string>): Plugin {
  const apiKey = env.OPENROUTER_API_KEY
  const model = env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'

  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url?.startsWith('/api/chat')) return next()
    if (req.method !== 'POST') return sendJson(res, 405, { error: { kind: 'method', message: 'Only POST is allowed.' } })

    if (!apiKey || apiKey.startsWith('sk-or-...')) {
      return sendJson(res, 200, {
        error: { kind: 'auth', message: 'OPENROUTER_API_KEY is not configured. Create a .env file (see .env.example).' },
      })
    }

    let payload: {
      messages?: unknown
      temperature?: number
      max_tokens?: number
      web?: boolean
    }
    try {
      payload = JSON.parse((await readBody(req)) || '{}')
    } catch {
      return sendJson(res, 400, { error: { kind: 'parse', message: 'Invalid request body.' } })
    }

    // Optionale Live-Websuche über OpenRouters Web-Plugin (nutzt denselben Key,
    // ~2 ct/Anfrage). Wird nur aktiviert, wenn der Client web=true sendet.
    const body: Record<string, unknown> = {
      model,
      temperature: payload.temperature ?? 0.5,
      max_tokens: payload.max_tokens ?? 1100,
      messages: payload.messages ?? [],
    }
    if (payload.web) {
      body.plugins = [{ id: 'web', max_results: 3 }]
    }

    let upstream: Response
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
      return sendJson(res, 200, { error: { kind: 'network', message: 'Connection to OpenRouter failed.' } })
    }

    if (upstream.status === 401) return sendJson(res, 200, { error: { kind: 'auth', message: 'OpenRouter API key is invalid.' } })
    if (upstream.status === 429) {
      const retry = parseInt(upstream.headers.get('retry-after') || '20', 10)
      return sendJson(res, 200, { error: { kind: 'rate', message: 'Rate limit reached. Please wait a moment.', retryAfter: retry } })
    }
    if (!upstream.ok) {
      const raw = await upstream.text().catch(() => '')
      return sendJson(res, 200, { error: { kind: 'other', message: `OpenRouter error ${upstream.status}`, raw } })
    }

    const json: any = await upstream.json().catch(() => null)
    const msg: any = json?.choices?.[0]?.message
    let content: string = msg?.content ?? ''

    // Bei aktiver Websuche liefert OpenRouter Quellen als url_citation-Annotationen.
    // Wir hängen bis zu drei eindeutige Quell-Links unter die Antwort.
    if (payload.web && Array.isArray(msg?.annotations)) {
      const urls: string[] = []
      for (const a of msg.annotations) {
        const u = a?.type === 'url_citation' ? a?.url_citation?.url : null
        if (u && !urls.includes(u)) urls.push(u)
        if (urls.length >= 3) break
      }
      if (urls.length > 0 && !content.includes(urls[0])) {
        content += '\n\nSources:\n' + urls.map((u) => `• ${u}`).join('\n')
      }
    }

    return sendJson(res, 200, { content })
  }

  return {
    name: 'openrouter-proxy',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

/**
 * Keyless Geo-Proxy für die Adress-Autofill-Funktion in Phase 2.
 * Beide Dienste sind kostenlos und ohne API-Key nutzbar — der Proxy bündelt
 * sie serverseitig (gleiche User-Agent/Referer-Policy, kein CORS im Client,
 * GitHub-tauglich, da keine Secrets nötig):
 *   - GET /api/geo/plz?plz=28203      → OpenPLZ: PLZ → Ort(e)
 *   - GET /api/geo/search?q=Domshof+Bremen → Nominatim (OSM): Adress-Vorschläge
 */
function geoProxy(): Plugin {
  // Nominatim verlangt einen identifizierenden User-Agent (Nutzungsrichtlinie).
  // Adressen wie "example.com" werden als Missbrauch geblockt → schlichte Kennung.
  const UA = 'FragDeinZuhause/1.0 (Kenergy Energieberater)'

  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url?.startsWith('/api/geo')) return next()
    const url = new URL(req.url, 'http://localhost')

    try {
      // PLZ → Ort (Konsistenz-Check + Vorbefüllung in Phase 2).
      if (url.pathname === '/api/geo/plz') {
        const plz = (url.searchParams.get('plz') || '').replace(/\D/g, '').slice(0, 5)
        if (plz.length !== 5) return sendJson(res, 400, { error: 'plz must have 5 digits' })
        const r = await fetch(
          `https://openplzapi.org/de/Localities?postalCode=${plz}`,
          { headers: { 'User-Agent': UA, Accept: 'application/json' } },
        )
        if (!r.ok) return sendJson(res, 200, { plz, places: [] })
        const data: any = await r.json().catch(() => [])
        const places: string[] = Array.isArray(data)
          ? [...new Set(data.map((d: any) => d?.name).filter(Boolean))]
          : []
        return sendJson(res, 200, { plz, places })
      }

      // Freitext-Adresssuche (Autocomplete) via Photon (Komoot).
      // Photon: free, kein API-Key, saubere Adressfelder, kein striktes Rate-Limit.
      // Location-Bias auf Deutschland-Mitte (51.2 N, 10.4 E) sorgt für DE-Priorisierung.
      if (url.pathname === '/api/geo/search') {
        const q = (url.searchParams.get('q') || '').trim()
        if (q.length < 3) return sendJson(res, 200, { results: [] })
        const r = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=15&lang=de&lat=51.2&lon=10.4&location_bias_scale=0.4`,
          { headers: { 'User-Agent': UA } },
        )
        if (!r.ok) return sendJson(res, 200, { results: [] })
        const data: any = await r.json().catch(() => ({ features: [] }))
        const features: any[] = Array.isArray(data?.features) ? data.features : []
        const seen = new Set<string>()
        const results: unknown[] = []
        for (const f of features) {
          const p = f.properties || {}
          // Nur Deutschland-Treffer (Photon hat keinen countrycodes-Filter)
          if (p.countrycode !== 'DE') continue
          const streetPart = [p.street, p.housenumber].filter(Boolean).join(' ')
          const placePart = [p.postcode, p.city || p.district || p.name].filter(Boolean).join(' ')
          const label = [streetPart || p.name, placePart].filter(Boolean).join(', ')
          // Deduplizierung: gleicher Label = gleiche Adresse (mehrere POIs am selben Haus)
          if (seen.has(label)) continue
          seen.add(label)
          results.push({
            label,
            street: (p.street || p.name || '') as string,
            houseNumber: (p.housenumber || '') as string,
            plz: (p.postcode || '') as string,
            ort: (p.city || p.district || p.county || '') as string,
          })
          if (results.length >= 5) break
        }
        return sendJson(res, 200, { results })
      }

      return sendJson(res, 404, { error: 'unknown geo endpoint' })
    } catch {
      return sendJson(res, 200, { results: [], places: [] })
    }
  }

  return {
    name: 'geo-proxy',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

export default defineConfig(({ mode }) => {
  // Lädt auch Variablen ohne VITE_-Präfix (nur serverseitig verfügbar).
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), openRouterProxy(env), geoProxy()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
  }
})
