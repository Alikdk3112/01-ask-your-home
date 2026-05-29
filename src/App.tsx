import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { emptyProfile, type EnergyPlan, type EthosResult, type UserProfile } from './lib/types'
import { STEPS, buildContextSequence, matchFreeTextToOption, type PresetOption, type Step, type StepId } from './lib/flow'
import { generateQuestion, type InterviewQuestion } from './lib/interview'
import { ethosLookup, ethosBuildingMatch } from './lib/ethos'
import { buildPlan } from './lib/plan'
import { SYSTEM_PROMPT, buildContextMessage } from './lib/prompt'
import { callHouse, type ChatMessage } from './lib/api'
import { TypingIndicator } from './components/TypingIndicator'
import { PresetButtons } from './components/PresetButtons'
import { SavingsReveal } from './components/SavingsReveal'
import { PlanView } from './components/PlanView'
import { Phase1, type Phase1Result } from './components/Phase1'
import { AddressStep, type AddressResult } from './components/AddressStep'
import { Slides } from './components/Slides'
import { HouseMascot } from './components/HouseMascot'

// Phasen: pitch (Pitch-Slides) → qualify (Phase 1) → address (Adresse + DB-Match)
//         → flow (Kontextfragen) → wow (Catcher) → chat (freier Dialog)
type Phase = 'pitch' | 'qualify' | 'address' | 'flow' | 'wow' | 'chat'

type ChatItem =
  | { id: number; kind: 'house'; text: string }
  | { id: number; kind: 'user'; text: string }
  | { id: number; kind: 'reveal' }
  | { id: number; kind: 'plan' }

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Keywords that make a live web search worthwhile (current subsidies, real
// prices/products, local installers). Keeps cost low because only matching
// questions trigger the paid web search.
const WEB_KEYWORDS = [
  'subsid',
  'grant',
  'funding',
  'rebate',
  'bafa',
  'kfw',
  'beg',
  'price',
  'cost',
  'how much',
  'offer',
  'deal',
  'buy',
  'where can i',
  'where do i',
  'current',
  'latest',
  'installer',
  'contractor',
  'tradesperson',
  'near me',
  'nearby',
  'compare',
  'comparison',
  'product',
  'model',
  'recommend',
]

function needsWeb(text: string): boolean {
  const t = text.toLowerCase()
  return WEB_KEYWORDS.some((k) => t.includes(k))
}

// Seed mit Date.now(), damit IDs auch nach einem HMR-Reload eindeutig bleiben
// (React behält den items-State, ein bei 0 startender Zähler würde sonst kollidieren).
let counter = Date.now()
const uid = () => ++counter

// Pitch-Mockup: Mit ?app=<screen> startet die App direkt in einem bestimmten
// Screen (für den iPhone-Rahmen der Slides) und überspringt die Pitch-Slides.
// Demo-Screens (plan/reveal) nutzen ein festes Demo-Profil; der Plan wird rein
// lokal/deterministisch berechnet, kein Netzwerk, kein LLM.
const APP_SCREEN =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('app') : null

interface DemoSeed {
  phase: Phase
  profile: UserProfile
  plan: EnergyPlan
  ethos: EthosResult
  items: ChatItem[]
}

function buildDemoSeed(): DemoSeed | null {
  if (APP_SCREEN !== 'plan' && APP_SCREEN !== 'reveal') return null
  const profile: UserProfile = {
    ...emptyProfile(),
    motivation: 'alles',
    ownership: 'mieter',
    buildingType: 'mfh',
    constructionPeriod: 'vor_1978',
    livingArea: 72,
    plz: '60594',
    ort: 'Frankfurt',
    heating: 'gas',
    monthlyCost: '150_250',
    existingMeasures: 'teilweise',
    priority: 'kosten',
    landlordRelation: 'gut',
  }
  const ethos = ethosLookup('60594')
  const plan = buildPlan(profile, ethos)
  const kind = APP_SCREEN === 'plan' ? 'plan' : 'reveal'
  const phase: Phase = APP_SCREEN === 'plan' ? 'chat' : 'wow'
  return { phase, profile, plan, ethos, items: [{ id: uid(), kind }] }
}

const DEMO = buildDemoSeed()
const START_PHASE: Phase = DEMO
  ? DEMO.phase
  : typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('app')
    ? 'qualify'
    : 'pitch'

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => DEMO?.profile ?? emptyProfile())
  const [contextSeq, setContextSeq] = useState<StepId[]>([])
  const [items, setItems] = useState<ChatItem[]>(() => DEMO?.items ?? [])
  const [phase, setPhase] = useState<Phase>(START_PHASE)
  const [stepId, setStepId] = useState<StepId | null>(null)
  // Aktuell angezeigte (LLM-generierte) Frage: Wortlaut + Button-Labels.
  const [dynStep, setDynStep] = useState<InterviewQuestion | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [plan, setPlan] = useState<EnergyPlan | null>(DEMO?.plan ?? null)
  const [ethos, setEthos] = useState<EthosResult | null>(DEMO?.ethos ?? null)
  const [wowExplained, setWowExplained] = useState(false)
  const [convo, setConvo] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  // Bereits gestellte Kontextfragen, damit das LLM sich nicht wiederholt.
  const askedRef = useRef<string[]>([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [items, isTyping, phase])

  async function houseSay(text: string, wait = 750) {
    setIsTyping(true)
    await delay(wait)
    setIsTyping(false)
    setItems((prev) => [...prev, { id: uid(), kind: 'house', text }])
  }

  function pushUser(text: string) {
    setItems((prev) => [...prev, { id: uid(), kind: 'user', text }])
  }

  // Nächste Kontextfrage live vom Haus formulieren lassen und anzeigen.
  async function askStep(id: StepId, p: UserProfile) {
    setStepId(id)
    setDynStep(null)
    setIsTyping(true)
    const q = await generateQuestion(p, id, askedRef.current)
    setIsTyping(false)
    askedRef.current = [...askedRef.current, q.message]
    setDynStep(q)
    setItems((prev) => [...prev, { id: uid(), kind: 'house', text: q.message }])
  }

  /* ── Phase 1 abgeschlossen → Profil-Grunddaten + Catcher übernehmen ── */
  function onPhase1Complete(data: Phase1Result) {
    setProfile((p) => ({
      ...p,
      ownership: data.ownership,
      buildingType: data.buildingType,
      plz: data.plz,
      motivation: 'alles',
    }))
    setPhase('address')
  }

  /* ── Adresse abgeschlossen → DB-Abgleich, Kontextfragen vorbereiten ── */
  async function onAddressComplete(addr: AddressResult) {
    // Profil mit konsistenter Adresse (PLZ aus Phase 1) anreichern.
    const match = ethosBuildingMatch(addr.plz, profile.buildingType)
    const seeded: UserProfile = {
      ...profile,
      street: addr.street,
      houseNumber: addr.houseNumber,
      plz: addr.plz,
      ort: addr.ort,
      // Baujahr/Periode aus DB-Abgleich übernehmen, sofern getroffen.
      constructionPeriod: match.period ?? profile.constructionPeriod,
    }
    setProfile(seeded)

    const seq = buildContextSequence(seeded, match)
    setContextSeq(seq)
    askedRef.current = []
    setPhase('flow')

    // Vorstellung des Hauses auf Basis des Abgleichs.
    const ortStr = `${addr.plz} ${addr.ort}`.trim()
    const adr = `${addr.street} ${addr.houseNumber}`.trim()
    if (match.matched) {
      await houseSay(
        `Hi, I'm Habi, your home. I had a look at the building data for ${adr}: I'm a ${match.archetypLabel} in ${ortStr}. There are still a few things I don't know, let's clear those up quickly.`,
        700,
      )
    } else {
      await houseSay(
        `Hi, I'm Habi, your home! Now I know my address: ${adr} in ${ortStr}. You told me I'm a ${match.archetypLabel}. Help me with a few details and my plan gets concrete.`,
        700,
      )
    }

    if (seq.length > 0) {
      await askStep(seq[0], seeded)
    } else {
      await finishToWow(seeded)
    }
  }

  async function finishToWow(p: UserProfile) {
    const e = ethosLookup(p.plz ?? '')
    const pl = buildPlan(p, e)
    setEthos(e)
    setPlan(pl)
    setPhase('wow')
    setIsTyping(true)
    await delay(950)
    setIsTyping(false)
    setItems((prev) => [...prev, { id: uid(), kind: 'reveal' }])
  }

  async function advance(step: Step, value: string | number, label: string) {
    pushUser(label)
    const next = { ...profile }
    ;(next as unknown as Record<string, unknown>)[step.field] = value
    setProfile(next)

    const inter = step.interstitial?.[String(value)]
    if (inter) await houseSay(inter)

    const idx = contextSeq.indexOf(step.id)
    const nextId = contextSeq[idx + 1]
    if (nextId) {
      await askStep(nextId, next)
    } else {
      await finishToWow(next)
    }
  }

  function onPick(option: PresetOption) {
    if (!stepId) return
    setDynStep(null)
    void advance(STEPS[stepId], option.value, option.label)
  }

  async function showPlan() {
    pushUser('Yes, show me my plan!')
    await houseSay('Gladly! Here’s what I worked out for us:')
    setItems((prev) => [...prev, { id: uid(), kind: 'plan' }])
    await houseSay('Ask me anything about it, I’m all ears.', 600)
    setPhase('chat')
  }

  async function explainCalc() {
    pushUser('How do you calculate this?')
    setWowExplained(true)
    const ist = plan?.demandIst ?? 0
    const soll = plan?.demandSoll ?? 0
    await houseSay(
      `I use the European building typology TABULA. It knows the typical consumption for every kind of building in Germany. Houses like me sit at around ${ist} kWh/m², while today’s standard is about ${soll} kWh/m². Your savings potential comes from that difference. These are guideline figures, but accurate enough that energy advisors start from them too.`,
    )
  }

  async function sendChat(text: string) {
    pushUser(text)
    setDraft('')
    setBusy(true)
    const preamble =
      convo.length === 0 && plan ? `${buildContextMessage(profile, plan)}\n\nMy question: ${text}` : text
    const nextConvo: ChatMessage[] = [...convo, { role: 'user', content: preamble }]
    const web = needsWeb(text)
    setIsTyping(true)
    const res = await callHouse([{ role: 'system', content: SYSTEM_PROMPT }, ...nextConvo], {
      web,
      maxTokens: web ? 900 : 600,
    })
    setIsTyping(false)
    setBusy(false)
    if (res.content) {
      setConvo([...nextConvo, { role: 'assistant', content: res.content }])
      setItems((prev) => [...prev, { id: uid(), kind: 'house', text: res.content! }])
    } else {
      const msg =
        res.error?.kind === 'auth'
          ? 'My online knowledge isn’t connected right now, but your plan above is still ready for you.'
          : 'Oops, I can’t get through at the moment. Try again in a sec, your plan above stays valid, of course.'
      setItems((prev) => [...prev, { id: uid(), kind: 'house', text: msg }])
    }
  }

  function onFreeText(text: string) {
    const t = text.trim()
    if (!t) return
    if (phase === 'chat') {
      void sendChat(t)
      return
    }
    // Im Fragen-Flow: Freitext erst auf eine Option des aktuellen Schritts abbilden.
    // Gegen die aktuell angezeigten (dynamischen) Labels matchen, Werte bleiben Enum.
    if (phase === 'flow' && stepId) {
      const current: Step = dynStep
        ? { ...STEPS[stepId], options: dynStep.options }
        : STEPS[stepId]
      const match = matchFreeTextToOption(current, t)
      if (match) {
        setDraft('')
        setDynStep(null)
        void advance(STEPS[stepId], match.value, match.label)
        return
      }
    }
    pushUser(t)
    setDraft('')
    setProfile((p) => ({ ...p, freeText: [...p.freeText, t] }))
    void houseSay('Noted, I’ll keep that in mind! Feel free to pick one of the options.', 500)
  }

  /* ── Pitch-Slides → Übergang in die Live-App ── */
  if (phase === 'pitch') {
    return <Slides onStart={() => setPhase('qualify')} />
  }

  /* ── Phase 1: Qualifizierung & Catcher ── */
  if (phase === 'qualify') {
    return <Phase1 onComplete={onPhase1Complete} />
  }

  /* ── Phase 2, Schritt 1: Adresse + Autofill ── */
  if (phase === 'address') {
    return <AddressStep plz={profile.plz ?? ''} onComplete={(d) => void onAddressComplete(d)} />
  }

  /* ── Phase 2, Schritt 3+: Chat (Kontextfragen / Wow / freier Dialog) ── */
  const step = stepId ? STEPS[stepId] : null
  const totalSteps = contextSeq.length + 1
  const answered = stepId ? contextSeq.indexOf(stepId) : contextSeq.length
  const progress = phase === 'flow' ? ((answered + 1) / totalSteps) * 100 : 100
  const showFlowControls = phase === 'flow' && !isTyping && !!dynStep
  const showFreeText = phase === 'flow' || phase === 'chat'

  return (
    <div className="mx-auto flex h-full max-w-[640px] flex-col px-4">
      <header className="flex items-center gap-3 py-4">
        <HouseMascot size={46} className="shrink-0" />
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight text-ink">Ask Your Home</h1>
          <p className="text-sm text-muted">Hi, I’m Habi, your home, talking energy</p>
        </div>
      </header>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-success transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="scrollbar-slim flex-1 space-y-4 overflow-y-auto py-5">
        {items.map((it) => {
          if (it.kind === 'house') {
            return (
              <div key={it.id} className="flex items-end gap-2 animate-rise">
                <HouseMascot size={38} mood="talking" className="shrink-0" />
                <div className="bubble max-w-[85%] whitespace-pre-wrap text-ink-soft">{it.text}</div>
              </div>
            )
          }
          if (it.kind === 'user') {
            return (
              <div key={it.id} className="flex justify-end animate-rise">
                <div className="bubble-user max-w-[85%] whitespace-pre-wrap">{it.text}</div>
              </div>
            )
          }
          if (it.kind === 'reveal' && plan && ethos) {
            // Vom Nutzer eingegebene Stadt hat Vorrang vor dem PLZ-Regions-Label.
            const ortLabel = profile.ort
              ? `${profile.plz ?? ''} ${profile.ort}`.trim()
              : ethos.ortLabel
            return (
              <SavingsReveal key={it.id} plan={plan} ortLabel={ortLabel} ownership={profile.ownership} />
            )
          }
          if (it.kind === 'plan' && plan) {
            return <PlanView key={it.id} plan={plan} profile={profile} />
          }
          return null
        })}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </main>

      <footer className="border-t border-line py-3">
        {showFlowControls && step && dynStep && step.input === 'preset' && (
          <PresetButtons options={dynStep.options} grid={step.grid} onPick={onPick} />
        )}

        {phase === 'wow' && !isTyping && (
          <div className="flex flex-col gap-2.5">
            <button type="button" className="ks-btn" onClick={() => void showPlan()}>
              <Sparkles className="h-5 w-5" /> Yes, show me my plan!
            </button>
            {!wowExplained && (
              <button type="button" className="ks-btn-ghost" onClick={() => void explainCalc()}>
                How do you calculate this?
              </button>
            )}
          </div>
        )}

        {showFreeText && (
          <form
            className="mt-2.5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              onFreeText(draft)
            }}
          >
            <input
              className="ks-input"
              placeholder={phase === 'chat' ? 'Ask me anything …' : 'Or just type freely …'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={busy}
            />
            <button type="submit" className="ks-btn px-4" disabled={busy || !draft.trim()} aria-label="Send">
              <Send className="h-5 w-5" />
            </button>
          </form>
        )}
      </footer>
    </div>
  )
}
