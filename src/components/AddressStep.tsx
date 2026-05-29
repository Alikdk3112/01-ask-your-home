import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Home, MapPin, Search, ShieldCheck } from 'lucide-react'
import { lookupPlzOrt, searchAddress, type AddressHit } from '../lib/geo'
import { PrivacyNotice } from './PrivacyNotice'

export interface AddressResult {
  street: string
  houseNumber: string
  plz: string
  ort: string
}

interface Props {
  // PLZ aus Phase 1 als Startwert. Wird durch eine gewählte Adresse überschrieben,
  // falls diese eine andere PLZ trägt (die Adresseingabe gewinnt).
  plz: string
  onComplete: (data: AddressResult) => void
}

export function AddressStep({ plz: initialPlz, onComplete }: Props) {
  const [street, setStreet] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [plz, setPlz] = useState(initialPlz)
  const [ort, setOrt] = useState('')
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<AddressHit[]>([])
  const [open, setOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Ort aus der aktuell gesetzten PLZ automatisch vorbefüllen, solange er leer ist.
  useEffect(() => {
    let cancelled = false
    lookupPlzOrt(plz).then((places) => {
      if (!cancelled && places.length > 0) setOrt((cur) => cur || places[0])
    })
    return () => {
      cancelled = true
    }
  }, [plz])

  // Debounced Adress-Autocomplete. Bundesweit, damit auch Adressen in einer
  // anderen PLZ-Region als in Phase 1 gefunden werden.
  useEffect(() => {
    if (query.trim().length < 3) {
      setHits([])
      return
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const res = await searchAddress(query, ctrl.signal)
      setHits(res)
      setOpen(true)
    }, 320)
    return () => clearTimeout(t)
  }, [query])

  const choose = (h: AddressHit) => {
    if (h.street) setStreet(h.street)
    if (h.houseNumber) setHouseNumber(h.houseNumber)
    // PLZ und Ort aus der gewählten Adresse übernehmen (Adresse gewinnt).
    if (h.plz) setPlz(h.plz)
    if (h.ort) setOrt(h.ort)
    setQuery(`${h.street}${h.houseNumber ? ' ' + h.houseNumber : ''}`.trim())
    setOpen(false)
  }

  const canSubmit = street.trim().length > 1 && /^\d{5}$/.test(plz) && ort.trim().length > 1

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <header className="flex items-center justify-center gap-3 pb-2 pt-8">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white shadow-[var(--shadow-lift)]">
          <Home className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <h1 className="text-xl font-bold text-ink">Ask Your Home</h1>
      </header>

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4">
        <div className="w-full max-w-lg py-8">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <MapPin className="h-9 w-9" strokeWidth={1.8} />
            </div>
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Where exactly am I?</h2>
            <p className="text-muted">
              Your address helps me find precise building data — then my plan gets concrete.
            </p>
          </div>

          <div className="ks-card space-y-4 p-5">
            {/* Adress-Suche mit Autofill */}
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-ink-soft">Street &amp; house number</label>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:ring-2 focus-within:ring-brand">
                <Search className="h-4 w-4 shrink-0 text-muted" />
                <input
                  className="w-full bg-transparent py-2.5 outline-none"
                  placeholder="e.g. Domshof 18"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => hits.length && setOpen(true)}
                  autoFocus
                />
              </div>
              {open && hits.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-line bg-white shadow-lift">
                  {hits.map((h, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => choose(h)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
                      >
                        <span className="font-medium text-ink">
                          {h.street}{h.houseNumber ? ` ${h.houseNumber}` : ''}
                        </span>
                        <span className="block text-xs text-muted">
                          {[h.plz, h.ort].filter(Boolean).join(' ')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Fein-Korrektur Straße/Hausnummer (falls Autofill unvollständig) */}
            <div className="grid grid-cols-[1fr_90px] gap-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-soft">Street</label>
                <input className="ks-input" value={street} onChange={(e) => setStreet(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-soft">No.</label>
                <input className="ks-input" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} />
              </div>
            </div>

            {/* PLZ (Startwert aus Phase 1, durch gewählte Adresse überschreibbar) + Ort */}
            <div className="grid grid-cols-[90px_1fr] gap-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-soft">Postal code</label>
                <input
                  className="ks-input"
                  inputMode="numeric"
                  maxLength={5}
                  value={plz}
                  onChange={(e) => setPlz(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  aria-label="Postal code"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-soft">City</label>
                <input className="ks-input" value={ort} onChange={(e) => setOrt(e.target.value)} />
              </div>
            </div>

            <button
              type="button"
              className="ks-btn w-full"
              disabled={!canSubmit}
              onClick={() => onComplete({ street: street.trim(), houseNumber: houseNumber.trim(), plz, ort: ort.trim() })}
            >
              Continue to chat <ArrowRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="mx-auto flex items-center gap-1.5 text-center text-xs text-muted hover:text-ink-soft"
            >
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Address search via OpenStreetMap, no account, no tracking
            </button>
          </div>
        </div>
      </div>

      {privacyOpen && <PrivacyNotice onClose={() => setPrivacyOpen(false)} />}
    </div>
  )
}
