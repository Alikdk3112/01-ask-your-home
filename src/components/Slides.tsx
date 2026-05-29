import { useCallback, useEffect, useState, type ComponentType } from 'react'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Coins,
  Copy,
  Home,
  KeyRound,
  Leaf,
  Lock,
  MessageCircleHeart,
  Share,
  Sparkles,
  Target,
  Wand2,
} from 'lucide-react'
import { HouseMascot } from './HouseMascot'

// Pitch-Deck als In-App-Slides: Das Team klickt sich beim 5-Minuten-Pitch
// durch, der letzte Slide startet die echte App (onStart → phase 'qualify').
// Auf großen Screens läuft daneben die echte App live in einem iPhone-Mockup
// (iframe mit ?app=1, startet direkt in der Live-App statt im Pitch).

interface SlideDef {
  icon: ComponentType<{ className?: string; strokeWidth?: string | number }>
  kicker: string
  title: string
  body: ComponentType
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-brand-50 px-4 py-4 text-center">
      <div className="text-3xl font-bold text-brand-600">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  )
}

const SLIDES: SlideDef[] = [
  {
    icon: Home,
    kicker: 'Ask Your Home',
    title: 'What if your home could talk?',
    body: () => (
      <div className="space-y-5">
        <p className="text-xl leading-relaxed text-ink-soft [overflow-wrap:anywhere] sm:text-2xl">
          We turned the energy transition into a conversation, with the one thing
          that knows the building best:{' '}
          <span className="font-semibold text-ink">the home itself.</span>
        </p>
        <p className="text-base text-muted sm:text-lg">Meet <span className="font-semibold text-ink">Habi</span>, an AI energy advisor that speaks in the first person.</p>
      </div>
    ),
  },
  {
    icon: Target,
    kicker: 'The problem',
    title: 'Saving energy is confusing, costly, and feels out of reach',
    body: () => (
      <div className="space-y-6">
        <ul className="space-y-3 text-lg text-ink-soft [overflow-wrap:anywhere] sm:text-xl">
          <li className="flex gap-3">
            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
            <span>Households overpay on energy but don&apos;t know <em>which</em> fix pays off first.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
            <span>Professional energy advice is expensive, slow, and full of jargon.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
            <span>Tenants assume they can do nothing, and give up before they start.</span>
          </li>
        </ul>
        <div className="grid grid-cols-2 gap-4">
          <Stat value="~19M" label="inefficient buildings in Germany" />
          <Stat value="€100s/yr" label="wasted per household" />
        </div>
      </div>
    ),
  },
  {
    icon: Sparkles,
    kicker: 'The solution',
    title: 'Your home interviews you, then hands you a plan',
    body: () => (
      <div className="space-y-5">
        <p className="text-lg leading-relaxed text-ink-soft [overflow-wrap:anywhere] sm:text-xl">
          No forms, no jargon. The house asks a few friendly questions, looks up its own
          building data, and returns a ranked plan of measures with:
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-success-50 p-4 text-base font-medium text-success">€ saved / year</div>
          <div className="rounded-xl bg-brand-50 p-4 text-base font-medium text-brand-600">grants you qualify for</div>
          <div className="rounded-xl bg-amber-50 p-4 text-base font-medium text-amber-700">the next step</div>
        </div>
        <p className="text-base text-muted [overflow-wrap:anywhere] sm:text-lg">
          Backed by real data: TABULA building typology, ETHOS regional stats, current BAFA/KfW grants.
        </p>
      </div>
    ),
  },
  {
    icon: Wand2,
    kicker: 'Prototype, live in a moment',
    title: 'A working product, not a mockup',
    body: () => (
      <div className="space-y-5">
        <p className="text-lg leading-relaxed text-ink-soft sm:text-xl">In the next minutes you&apos;ll watch the real app:</p>
        <ol className="space-y-3 text-lg text-ink-soft [overflow-wrap:anywhere] sm:text-xl">
          {[
            'Tell the home who you are (tenant / owner, building, area)',
            'It pulls its own building data from your address',
            'A live AI interview fills the gaps, wording generated on the fly',
            'The savings reveal + a personalized, ranked plan',
          ].map((t, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-base font-bold text-brand-600">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>
    ),
  },
  {
    icon: KeyRound,
    kicker: 'Personalization',
    title: 'Two homes, two completely different journeys',
    body: () => (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="ks-card p-5">
            <div className="mb-2 inline-flex items-center gap-2 text-base font-semibold text-brand-600">
              <KeyRound className="h-5 w-5" strokeWidth={2} /> Tenant
            </div>
            <p className="text-base text-ink-soft [overflow-wrap:anywhere]">Quick wins, low-cost fixes, and a ready-made letter to the landlord.</p>
          </div>
          <div className="ks-card p-5">
            <div className="mb-2 inline-flex items-center gap-2 text-base font-semibold text-success">
              <Home className="h-5 w-5" strokeWidth={2} /> Owner
            </div>
            <p className="text-base text-ink-soft [overflow-wrap:anywhere]">Insulation, heat pumps, solar, plus grants and a solar partner handoff.</p>
          </div>
        </div>
        <p className="text-base text-muted [overflow-wrap:anywhere] sm:text-lg">
          Deterministic calculation for trust; LLM-generated wording for warmth. The numbers never drift.
        </p>
      </div>
    ),
  },
  {
    icon: Leaf,
    kicker: 'Impact',
    title: 'Every euro saved is also CO₂ saved',
    body: () => (
      <div className="space-y-6">
        <p className="text-lg leading-relaxed text-ink-soft [overflow-wrap:anywhere] sm:text-xl">
          Buildings cause <span className="font-semibold text-ink">~30% of Germany&apos;s CO₂</span>,
          and home heating is the single biggest lever. The measures that cut bills are the
          exact same ones that cut emissions.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-success-50 px-5 py-5 text-center">
            <div className="text-3xl font-bold text-success">€100s</div>
            <div className="mt-1 text-sm text-ink-soft">saved per home / year</div>
          </div>
          <div className="rounded-2xl bg-success-50 px-5 py-5 text-center">
            <div className="text-3xl font-bold text-success">~1 t</div>
            <div className="mt-1 text-sm text-ink-soft">CO₂ avoided per home / year</div>
          </div>
        </div>
        <p className="text-base text-muted [overflow-wrap:anywhere] sm:text-lg">
          We make the climate-smart choice the <span className="font-semibold text-ink">profitable</span> one,
          turning millions of homes into the easiest win of the energy transition.
        </p>
      </div>
    ),
  },
  {
    icon: Coins,
    kicker: 'Business potential',
    title: 'Every recommendation is a high-intent referral',
    body: () => (
      <div className="space-y-5">
        <div className="rounded-2xl bg-success-50 px-5 py-4">
          <div className="text-lg font-semibold text-success">Main revenue: affiliate links</div>
          <p className="mt-1 text-base text-ink-soft [overflow-wrap:anywhere]">
            Each measure links to a provider, and we earn a commission on every conversion.
          </p>
        </div>
        <ul className="space-y-3 text-lg text-ink-soft [overflow-wrap:anywhere] sm:text-xl">
          <li className="flex gap-3">
            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
            <span><span className="font-semibold text-ink">Paid placement:</span> providers can pay to be recommended more prominently.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
            <span><span className="font-semibold text-ink">B2B2C reach</span> via Kenergy &amp; municipal utilities: they bring the homes.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
            <span>Solar handoff to Kenergy exactly when the home is a good fit.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: MessageCircleHeart,
    kicker: 'Let’s see it',
    title: 'Now let the house speak for itself',
    body: () => (
      <p className="text-xl leading-relaxed text-ink-soft [overflow-wrap:anywhere] sm:text-2xl">
        Everything from here is the live product. Click below and meet your home.
      </p>
    ),
  },
]

// Welcher Live-Screen je Slide im Mockup läuft (?app=<screen> in App.tsx).
// Demo-Screens (reveal/plan) seeden ein festes Demo-Profil, rein lokal berechnet.
const SCREEN_BY_SLIDE = ['qualify', 'qualify', 'reveal', 'qualify', 'plan', 'reveal', 'plan', 'reveal']

// Echte App live in einem iPhone-Rahmen, als Web-App in Safari (iOS-Statusbar
// oben, Safari-Adressleiste unten). Logische 390-px-Breite, per transform auf den
// Bildschirm-Innenraum skaliert. Pro Slide ein anderer Screen.
function PhoneMock({ screen }: { screen: string }) {
  return (
    <div className="relative h-[600px] w-[296px] shrink-0 rounded-[2.75rem] border-[11px] border-ink bg-ink shadow-2xl">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[2.05rem] bg-[#f2f2f7]">
        {/* iOS-Statusbar mit Dynamic Island */}
        <div className="relative flex h-9 shrink-0 items-center justify-between bg-white px-6 pt-1 text-[11px] font-semibold text-ink">
          <span>9:41</span>
          <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-ink" />
          <div className="flex items-center gap-1">
            <SignalBars />
            <WifiGlyph />
            <BatteryGlyph />
          </div>
        </div>

        {/* Live-App im Safari-Viewport */}
        <div className="relative flex-1 overflow-hidden bg-white">
          <iframe
            key={screen}
            title="Ask Your Home live preview"
            src={`?app=${screen}`}
            className="origin-top-left border-0"
            style={{ width: 390, height: 720, transform: 'scale(0.7026)' }}
          />
        </div>

        {/* Safari-Adressleiste unten (iOS 15+) */}
        <div className="shrink-0 border-t border-black/10 bg-[#f7f7f9] px-3 pb-2 pt-2">
          <div className="mx-auto flex w-[88%] items-center gap-1.5 rounded-xl bg-[#e4e4e9] px-3 py-1.5 text-[11px] text-ink-soft">
            <Lock size={10} className="shrink-0 text-muted" />
            <span className="mx-auto truncate font-medium">ask-your-home.app</span>
            <Copy size={11} className="shrink-0 text-muted" />
          </div>
          <div className="mt-2 flex items-center justify-between px-2 text-brand">
            <ChevronLeft size={18} />
            <ChevronRight size={18} className="text-muted/40" />
            <Share size={16} />
            <BookOpen size={16} />
            <TabsGlyph />
          </div>
        </div>
      </div>
    </div>
  )
}

function SignalBars() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor" aria-hidden>
      <rect x="0" y="7" width="3" height="4" rx="0.6" />
      <rect x="4.5" y="5" width="3" height="6" rx="0.6" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="0.6" />
      <rect x="13" y="0" width="3" height="11" rx="0.6" />
    </svg>
  )
}

function WifiGlyph() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor" aria-hidden>
      <path d="M7.5 2.2c2.6 0 5 1 6.8 2.7l-1.3 1.4A8 8 0 0 0 7.5 4.1 8 8 0 0 0 2 6.3L0.7 4.9A9.9 9.9 0 0 1 7.5 2.2Z" />
      <path d="M7.5 5.6c1.5 0 2.9.6 4 1.6L7.5 11 3.5 7.2a5.9 5.9 0 0 1 4-1.6Z" />
    </svg>
  )
}

function BatteryGlyph() {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" opacity="0.4" />
      <rect x="2" y="2" width="17" height="8" rx="1.6" fill="currentColor" />
      <rect x="24" y="4" width="1.6" height="4" rx="0.8" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

function TabsGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="5.5" y="0.8" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" fill="#f7f7f9" />
    </svg>
  )
}

interface Props {
  onStart: () => void
}

export function Slides({ onStart }: Props) {
  const [i, setI] = useState(0)
  const last = i === SLIDES.length - 1

  const next = useCallback(() => {
    setI((v) => Math.min(v + 1, SLIDES.length - 1))
  }, [])
  const prev = useCallback(() => {
    setI((v) => Math.max(v - 1, 0))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        last ? onStart() : next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === 'Enter' && last) {
        e.preventDefault()
        onStart()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last, next, prev, onStart])

  const slide = SLIDES[i]
  const Icon = slide.icon
  const Body = slide.body

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-6">
      <header className="flex items-center gap-3 py-5">
        <HouseMascot size={50} className="shrink-0" />
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight text-ink">Ask Your Home</h1>
          <p className="text-sm text-muted">LAUNCH Rhein-Main Build Days</p>
        </div>
        <button type="button" onClick={onStart} className="text-sm font-medium text-muted hover:text-ink-soft">
          Skip →
        </button>
      </header>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-success transition-all duration-500"
          style={{ width: `${((i + 1) / SLIDES.length) * 100}%` }}
        />
      </div>

      <main className="flex flex-1 items-center justify-center gap-10 py-6">
        <div className="ks-card animate-rise flex min-h-[62vh] w-full flex-col justify-center p-8 sm:p-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-600">
              <Icon className="h-7 w-7" strokeWidth={1.8} />
            </div>
            <span className="text-base font-semibold uppercase tracking-wide text-brand-600">{slide.kicker}</span>
          </div>
          <h2 className="mb-6 text-3xl font-bold leading-tight text-ink [overflow-wrap:anywhere] sm:text-4xl">
            {slide.title}
          </h2>
          <Body />
        </div>

        <div className="hidden lg:block">
          <PhoneMock screen={SCREEN_BY_SLIDE[i] ?? 'qualify'} />
        </div>
      </main>

      <footer className="border-t border-line py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={i === 0}
            className="ks-btn-ghost px-4"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === i ? 'w-6 bg-brand' : 'w-2 bg-line hover:bg-muted'
                }`}
              />
            ))}
          </div>

          {last ? (
            <button type="button" onClick={onStart} className="ks-btn px-5">
              <Sparkles className="h-5 w-5" /> See it live
            </button>
          ) : (
            <button type="button" onClick={next} className="ks-btn px-4" aria-label="Next slide">
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
