import { useState } from 'react'
import { ArrowRight, ChevronLeft, Home, KeyRound, MapPin, Sparkles, TrendingDown, Zap } from 'lucide-react'
import type { BuildingType, Ownership } from '../lib/types'
import { isValidPlz } from '../lib/ethos'
import { estimateRegionalSavings, type RegionalEstimate } from '../lib/regional'
import { CountUp } from './CountUp'
import { HouseMascot } from './HouseMascot'

/* ── Ergebnis von Phase 1 (Übergabe an die App / Phase 2) ── */
export interface Phase1Result {
  ownership: Ownership
  buildingType: BuildingType
  plz: string
  estimate: RegionalEstimate
}

interface Props {
  onComplete: (data: Phase1Result) => void
}

/* ── Thematische Gebäude-Icons (hochwertige Linien-Silhouetten) ── */
function EfhIcon({ active }: { active: boolean }) {
  const c = active ? '#2563eb' : '#3B82F6'
  return (
    <svg className="h-16 w-16 sm:h-20 sm:w-20" viewBox="0 0 64 64" fill="none">
      <path d="M32 12L12 28V54H52V28L32 12Z" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="26" y="40" width="12" height="14" stroke={c} strokeWidth="2.5" />
      <rect x="18" y="32" width="8" height="8" stroke={c} strokeWidth="2.5" />
      <rect x="38" y="32" width="8" height="8" stroke={c} strokeWidth="2.5" />
    </svg>
  )
}
function MfhIcon({ active }: { active: boolean }) {
  const c = active ? '#2563eb' : '#3B82F6'
  return (
    <svg className="h-16 w-16 sm:h-20 sm:w-20" viewBox="0 0 64 64" fill="none">
      <rect x="14" y="10" width="36" height="44" stroke={c} strokeWidth="2.5" />
      <path d="M14 10L32 2L50 10" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="26" y="40" width="12" height="14" stroke={c} strokeWidth="2.5" />
      <rect x="20" y="20" width="8" height="8" stroke={c} strokeWidth="2.5" />
      <rect x="36" y="20" width="8" height="8" stroke={c} strokeWidth="2.5" />
      <rect x="20" y="32" width="8" height="6" stroke={c} strokeWidth="2.5" />
      <rect x="36" y="32" width="8" height="6" stroke={c} strokeWidth="2.5" />
    </svg>
  )
}
function VillaIcon({ active }: { active: boolean }) {
  const c = active ? '#2563eb' : '#3B82F6'
  return (
    <svg className="h-16 w-16 sm:h-20 sm:w-20" viewBox="0 0 64 64" fill="none">
      <path d="M32 10L10 26V54H54V26L32 10Z" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="27" y="38" width="10" height="16" stroke={c} strokeWidth="2.5" />
      <circle cx="32" cy="46" r="1.5" fill={c} />
      <rect x="16" y="30" width="10" height="10" stroke={c} strokeWidth="2.5" />
      <rect x="38" y="30" width="10" height="10" stroke={c} strokeWidth="2.5" />
    </svg>
  )
}
function ReihenIcon({ active }: { active: boolean }) {
  const c = active ? '#2563eb' : '#3B82F6'
  return (
    <svg className="h-16 w-16 sm:h-20 sm:w-20" viewBox="0 0 64 64" fill="none">
      <path d="M4 54V28L13 20L22 28V54M22 54V28L32 20L42 28V54M42 54V28L51 20L60 28V54" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="8" y="42" width="10" height="12" stroke={c} strokeWidth="2.5" />
      <rect x="27" y="42" width="10" height="12" stroke={c} strokeWidth="2.5" />
      <rect x="46" y="42" width="10" height="12" stroke={c} strokeWidth="2.5" />
    </svg>
  )
}

const HOUSE_OPTIONS: { key: BuildingType; label: string; Icon: (p: { active: boolean }) => JSX.Element }[] = [
  { key: 'efh', label: 'Single-family house', Icon: EfhIcon },
  { key: 'mfh', label: 'Apartment building', Icon: MfhIcon },
  { key: 'villa', label: 'Villa', Icon: VillaIcon },
  { key: 'reihenhaus', label: 'Terraced house', Icon: ReihenIcon },
]

/* ── Komponente ── */
export function Phase1({ onComplete }: Props) {
  // step: 1 Eigentum · 2 Haustyp · 3 PLZ · 4 Catcher (Ergebnis)
  const [step, setStep] = useState(1)
  const [ownership, setOwnership] = useState<Ownership | null>(null)
  const [buildingType, setBuildingType] = useState<BuildingType | null>(null)
  const [plz, setPlz] = useState('')
  const [estimate, setEstimate] = useState<RegionalEstimate | null>(null)
  const [showCalc, setShowCalc] = useState(false)

  const plzOk = isValidPlz(plz)

  // Card-Styling (gemeinsam)
  const base =
    'rounded-3xl transition-all duration-200 flex flex-col items-center justify-center gap-4 cursor-pointer select-none'
  const on = 'bg-brand-100 shadow-lg ring-2 ring-brand'
  const off = 'bg-white hover:bg-brand-50 shadow-[var(--shadow-card)]'

  const pickOwnership = (o: Ownership) => {
    setOwnership(o)
    setTimeout(() => setStep(2), 380)
  }
  const pickType = (t: BuildingType) => {
    setBuildingType(t)
    setTimeout(() => setStep(3), 380)
  }
  const submitPlz = () => {
    if (!plzOk || !ownership || !buildingType) return
    const est = estimateRegionalSavings(ownership, buildingType, plz)
    setEstimate(est)
    setStep(4)
  }

  const progress = (Math.min(step, 4) / 4) * 100

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <header className="flex items-center justify-center gap-3 pb-2 pt-8">
        <HouseMascot size={42} />
        <h1 className="text-xl font-bold text-ink">Ask Your Home</h1>
      </header>

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4">
        <div className="w-full max-w-4xl py-8">
          {/* Schritt 1: Eigentum oder Miete */}
          {step === 1 && (
            <div className="animate-fade space-y-10">
              <h2 className="text-center text-2xl font-semibold text-ink sm:text-3xl">
                Do you rent, or do you own your home?
              </h2>
              <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => pickOwnership('mieter')}
                  className={`aspect-square ${base} ${ownership === 'mieter' ? on : off}`}
                >
                  <KeyRound className="h-14 w-14 sm:h-16 sm:w-16" strokeWidth={1.5} color={ownership === 'mieter' ? '#2563eb' : '#3B82F6'} />
                  <span className="text-base font-medium text-ink sm:text-lg">Renting</span>
                </button>
                <button
                  onClick={() => pickOwnership('eigentuemer')}
                  className={`aspect-square ${base} ${ownership === 'eigentuemer' ? on : off}`}
                >
                  <Home className="h-14 w-14 sm:h-16 sm:w-16" strokeWidth={1.5} color={ownership === 'eigentuemer' ? '#2563eb' : '#3B82F6'} />
                  <span className="text-base font-medium text-ink sm:text-lg">Owner</span>
                </button>
              </div>
            </div>
          )}

          {/* Schritt 2: Haustyp */}
          {step === 2 && (
            <div className="animate-fade space-y-10">
              <h2 className="text-center text-2xl font-semibold text-ink sm:text-3xl">What type of building?</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {HOUSE_OPTIONS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => pickType(key)}
                    className={`aspect-square ${base} ${buildingType === key ? on : off}`}
                  >
                    <Icon active={buildingType === key} />
                    <span className="text-sm font-medium text-ink sm:text-base">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Schritt 3: PLZ */}
          {step === 3 && (
            <div className="animate-fade space-y-10">
              <div className="flex flex-col items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <MapPin className="h-9 w-9" strokeWidth={1.8} />
                </div>
                <h2 className="text-center text-2xl font-semibold text-ink sm:text-3xl">
                  Which area are you in?
                </h2>
                <p className="text-center text-muted">Your postal code is enough for a first estimate.</p>
              </div>
              <form
                className="mx-auto flex max-w-sm gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  submitPlz()
                }}
              >
                <input
                  className="ks-input text-center text-lg tracking-widest"
                  inputMode="numeric"
                  autoFocus
                  maxLength={5}
                  placeholder="e.g. 28203"
                  value={plz}
                  onChange={(e) => setPlz(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  aria-label="Postal code"
                />
                <button type="submit" className="ks-btn px-5" disabled={!plzOk} aria-label="Calculate">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            </div>
          )}

          {/* Schritt 4: Regionaler Catcher / Hook */}
          {step === 4 && estimate && ownership && (
            <div className="animate-rise mx-auto max-w-xl space-y-6">
              <div className="ks-card overflow-hidden">
                <div className="space-y-2 p-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted">
                    <Sparkles className="h-4 w-4 text-brand-600" strokeWidth={2} /> First estimate for{' '}
                    {estimate.regionLabel}
                  </div>
                  <p className="leading-relaxed text-ink-soft">
                    Households like yours in{' '}
                    <span className="font-semibold text-ink">{plz} {estimate.regionLabel}</span> use about{' '}
                    <span className="font-semibold text-ink">{estimate.demandIst} kWh/m²</span> a year,
                    noticeably more than today’s standard of roughly{' '}
                    <span className="font-semibold text-ink">{estimate.demandSoll} kWh/m²</span>.
                  </p>
                </div>

                <div className="border-t border-line bg-success-50 px-6 py-7 text-center">
                  <div className="mb-1 text-sm font-medium text-success">
                    Your estimated savings potential per year
                  </div>
                  <div className="flex items-center justify-center gap-2 text-success">
                    <TrendingDown className="h-7 w-7" strokeWidth={2.2} />
                    <span className="text-5xl font-bold tracking-tight">
                      <CountUp to={estimate.savingsMid} prefix="~€" />
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-success/80">
                    range €{estimate.savingsMin}–{estimate.savingsMax} · regional guideline
                  </div>
                </div>

                <div className="space-y-1 p-6">
                  <p className="text-ink-soft">
                    {ownership === 'mieter'
                      ? 'As a tenant you can tackle more of this yourself than you’d think.'
                      : 'As an owner every lever is open to you.'}{' '}
                    For a concrete plan, I’ll take a closer look at your building.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  className="ks-btn"
                  onClick={() =>
                    onComplete({ ownership, buildingType: buildingType!, plz, estimate })
                  }
                >
                  <Zap className="h-5 w-5" /> Create my concrete plan
                </button>
                {!showCalc ? (
                  <button type="button" className="ks-btn-ghost" onClick={() => setShowCalc(true)}>
                    How do you calculate this?
                  </button>
                ) : (
                  <p className="rounded-2xl bg-brand-50 p-4 text-sm leading-relaxed text-ink-soft">
                    I use the European building typology <strong>TABULA</strong>. It knows the typical
                    consumption for each building type in Germany. Your potential comes from the
                    difference between today’s stock ({estimate.demandIst} kWh/m²) and the standard
                    ({estimate.demandSoll} kWh/m²). That’s a regional guideline — in the next step it
                    becomes concrete for your building.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          {step > 1 && step < 4 && (
            <div className="mt-12 flex justify-center sm:mt-16">
              <button onClick={() => setStep((s) => s - 1)} className="ks-btn-ghost px-6 sm:px-8">
                <ChevronLeft className="h-5 w-5" /> Back
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full border-t border-line bg-white/80 backdrop-blur-sm">
        <div
          className="h-2 bg-gradient-to-r from-brand to-success transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
