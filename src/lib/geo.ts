// Frontend-Client für den keyless Geo-Proxy (/api/geo). Keine Keys im Client.

export interface AddressHit {
  label: string
  street: string
  houseNumber: string
  plz: string
  ort: string
}

// PLZ → Ort(e). Genutzt zur Vorbefüllung & Konsistenzprüfung in Phase 2.
export async function lookupPlzOrt(plz: string): Promise<string[]> {
  try {
    const r = await fetch(`/api/geo/plz?plz=${encodeURIComponent(plz)}`)
    if (!r.ok) return []
    const data = (await r.json()) as { places?: string[] }
    return data.places ?? []
  } catch {
    return []
  }
}

// Freitext-Adresssuche (Autocomplete) via OSM/Nominatim.
export async function searchAddress(query: string, signal?: AbortSignal): Promise<AddressHit[]> {
  try {
    const r = await fetch(`/api/geo/search?q=${encodeURIComponent(query)}`, { signal })
    if (!r.ok) return []
    const data = (await r.json()) as { results?: AddressHit[] }
    return data.results ?? []
  } catch {
    return []
  }
}
