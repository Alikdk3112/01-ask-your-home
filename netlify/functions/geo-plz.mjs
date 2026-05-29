// Netlify Function: PLZ → Ort(e) via OpenPLZ (kostenlos, kein Key).
// Spiegelt /api/geo/plz aus vite.config.ts (geoProxy).

const UA = 'FragDeinZuhause/1.0 (Kenergy Energieberater)'

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export default async (req) => {
  const url = new URL(req.url)
  const plz = (url.searchParams.get('plz') || '').replace(/\D/g, '').slice(0, 5)
  if (plz.length !== 5) return json(400, { error: 'plz must have 5 digits' })

  try {
    const r = await fetch(`https://openplzapi.org/de/Localities?postalCode=${plz}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    })
    if (!r.ok) return json(200, { plz, places: [] })
    const data = await r.json().catch(() => [])
    const places = Array.isArray(data)
      ? [...new Set(data.map((d) => d?.name).filter(Boolean))]
      : []
    return json(200, { plz, places })
  } catch {
    return json(200, { plz, places: [] })
  }
}
