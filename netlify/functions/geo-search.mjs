// Netlify Function: Freitext-Adresssuche via Photon (Komoot, kostenlos, kein Key).
// Spiegelt /api/geo/search aus vite.config.ts (geoProxy).

const UA = 'FragDeinZuhause/1.0 (Kenergy Energieberater)'

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export default async (req) => {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim()
  if (q.length < 3) return json(200, { results: [] })

  try {
    const r = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=15&lang=de&lat=51.2&lon=10.4&location_bias_scale=0.4`,
      { headers: { 'User-Agent': UA } },
    )
    if (!r.ok) return json(200, { results: [] })
    const data = await r.json().catch(() => ({ features: [] }))
    const features = Array.isArray(data?.features) ? data.features : []
    const seen = new Set()
    const results = []
    for (const f of features) {
      const p = f.properties || {}
      if (p.countrycode !== 'DE') continue
      const streetPart = [p.street, p.housenumber].filter(Boolean).join(' ')
      const placePart = [p.postcode, p.city || p.district || p.name].filter(Boolean).join(' ')
      const label = [streetPart || p.name, placePart].filter(Boolean).join(', ')
      if (seen.has(label)) continue
      seen.add(label)
      results.push({
        label,
        street: p.street || p.name || '',
        houseNumber: p.housenumber || '',
        plz: p.postcode || '',
        ort: p.city || p.district || p.county || '',
      })
      if (results.length >= 5) break
    }
    return json(200, { results })
  } catch {
    return json(200, { results: [] })
  }
}
