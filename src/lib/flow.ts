import type { LucideIcon } from 'lucide-react'
import {
  Building,
  Building2,
  Calendar,
  Castle,
  Circle,
  CircleCheck,
  CircleDot,
  Coins,
  Compass,
  Droplets,
  Factory,
  Flame,
  Frown,
  Gauge,
  Heart,
  HelpCircle,
  Home,
  KeyRound,
  Leaf,
  Meh,
  Ruler,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smile,
  Sparkles,
  Wallet,
  Wind,
  Zap,
} from 'lucide-react'
import type { EthosBuilding, Ownership, UserProfile } from './types'

export type StepId =
  | 'motivation'
  | 'ownership'
  | 'buildingType'
  | 'constructionPeriod'
  | 'livingArea'
  | 'plz'
  | 'heating'
  | 'landlordRelation'
  | 'insulation'
  | 'budget'
  | 'monthlyCost'
  | 'existingMeasures'
  | 'priority'

export interface PresetOption {
  label: string
  value: string | number
  icon?: LucideIcon
  sub?: string
}

export interface Step {
  id: StepId
  field: keyof UserProfile
  message: string
  input: 'preset' | 'plz'
  options?: PresetOption[]
  grid?: boolean // Optionen als 2-spaltiges Karten-Raster (visueller Picker)
  // Empathische Zwischennachricht nach bestimmten Antworten (z.B. nach Eigentumsfrage).
  interstitial?: Record<string, string>
}

export const STEPS: Record<StepId, Step> = {
  motivation: {
    id: 'motivation',
    field: 'motivation',
    message: 'Hey! Before we start: what’s on your mind the most right now?',
    input: 'preset',
    options: [
      { label: 'My heating costs are too high', value: 'heizkosten', icon: Flame },
      { label: 'My electricity bill annoys me', value: 'strom', icon: Zap },
      { label: 'I want to live more sustainably', value: 'nachhaltigkeit', icon: Leaf },
      { label: 'Honestly: all of it', value: 'alles', icon: Sparkles },
    ],
  },
  ownership: {
    id: 'ownership',
    field: 'ownership',
    message: 'Good, we’ll sort that out. Tell me: do you rent, or do I belong to you?',
    input: 'preset',
    options: [
      { label: 'I rent', value: 'mieter', icon: KeyRound },
      { label: 'I own you', value: 'eigentuemer', icon: Home },
    ],
    interstitial: {
      mieter:
        'Tenants often have more options than they think. Let’s find out which ones work for you.',
      eigentuemer:
        'Great, as an owner every door is open to you. The only question is: where do we start?',
    },
  },
  buildingType: {
    id: 'buildingType',
    field: 'buildingType',
    message: 'Now about me: what kind of building am I, actually?',
    input: 'preset',
    grid: true,
    options: [
      { label: 'Single-family house', value: 'efh', icon: Home },
      { label: 'Apartment building', value: 'mfh', icon: Building2 },
      { label: 'Terraced/semi-detached', value: 'reihenhaus', icon: Building },
      { label: 'Villa', value: 'villa', icon: Castle },
    ],
  },
  constructionPeriod: {
    id: 'constructionPeriod',
    field: 'constructionPeriod',
    message: 'Do you roughly know when I was built?',
    input: 'preset',
    options: [
      { label: 'Before 1978', value: 'vor_1978', icon: Calendar },
      { label: '1978 – 1995', value: '1978_1995', icon: Calendar },
      { label: '1995 – 2010', value: '1995_2010', icon: Calendar },
      { label: 'After 2010', value: 'nach_2010', icon: Calendar },
      { label: 'I don’t know', value: 'unbekannt', icon: HelpCircle },
    ],
  },
  livingArea: {
    id: 'livingArea',
    field: 'livingArea',
    message: 'And roughly how big am I?',
    input: 'preset',
    options: [
      { label: 'Under 50 m²', value: 40, icon: Ruler },
      { label: '50 – 80 m²', value: 65, icon: Ruler },
      { label: '80 – 120 m²', value: 100, icon: Ruler },
      { label: '120 – 160 m²', value: 140, icon: Ruler },
      { label: 'Over 160 m²', value: 200, icon: Ruler },
    ],
  },
  plz: {
    id: 'plz',
    field: 'plz',
    message: 'Almost there! What area am I in?',
    input: 'plz',
  },
  heating: {
    id: 'heating',
    field: 'heating',
    message: 'Tell me: how do I actually get warm?',
    input: 'preset',
    options: [
      { label: 'Gas', value: 'gas', icon: Flame },
      { label: 'Oil', value: 'oel', icon: Droplets },
      { label: 'District heating', value: 'fernwaerme', icon: Factory },
      { label: 'Heat pump', value: 'waermepumpe', icon: Wind },
      { label: 'Electricity', value: 'strom', icon: Zap },
      { label: 'I don’t know', value: 'unbekannt', icon: HelpCircle },
    ],
  },
  landlordRelation: {
    id: 'landlordRelation',
    field: 'landlordRelation',
    message: 'How’s it with my landlord, can you talk to them?',
    input: 'preset',
    options: [
      { label: 'Easy to reach', value: 'gut', icon: Smile },
      { label: 'So-so', value: 'geht_so', icon: Meh },
      { label: 'Rather difficult', value: 'schwierig', icon: Frown },
      { label: 'Property management', value: 'hausverwaltung', icon: Building2 },
    ],
  },
  insulation: {
    id: 'insulation',
    field: 'insulation',
    message: 'In winter my walls sometimes feel cold. Am I actually insulated?',
    input: 'preset',
    options: [
      { label: 'Yes, fully', value: 'ja', icon: ShieldCheck },
      { label: 'Partly', value: 'teilweise', icon: Shield },
      { label: 'No', value: 'nein', icon: ShieldOff },
      { label: 'I don’t know', value: 'unbekannt', icon: HelpCircle },
    ],
  },
  budget: {
    id: 'budget',
    field: 'budget',
    message: 'If we want to spruce me up, roughly how much can it cost?',
    input: 'preset',
    options: [
      { label: 'Under €500', value: 'unter_500', icon: Wallet },
      { label: '€500 to €2,000', value: '500_2k', icon: Wallet },
      { label: '€2,000 to €10,000', value: '2k_10k', icon: Wallet },
      { label: 'Over €10,000', value: 'ueber_10k', icon: Wallet },
      { label: 'Just exploring for now', value: 'informieren', icon: Compass },
    ],
  },
  monthlyCost: {
    id: 'monthlyCost',
    field: 'monthlyCost',
    message: 'Do you roughly know what you pay per month for heat and electricity?',
    input: 'preset',
    options: [
      { label: 'Under €100', value: 'unter_100', icon: Coins },
      { label: '€100 to €150', value: '100_150', icon: Coins },
      { label: '€150 to €250', value: '150_250', icon: Coins },
      { label: 'Over €250', value: 'ueber_250', icon: Coins },
      { label: 'I don’t know', value: 'unbekannt', icon: HelpCircle },
    ],
    interstitial: {
      ueber_250: 'That sounds like quite a lot. That’s exactly where a closer look pays off most.',
      unbekannt: 'No problem, I’ll estimate it based on houses like me.',
    },
  },
  existingMeasures: {
    id: 'existingMeasures',
    field: 'existingMeasures',
    message: 'Have you upgraded anything yet, like LEDs, smart thermostats or new windows?',
    input: 'preset',
    options: [
      { label: 'Yes, quite a bit', value: 'viel', icon: CircleCheck },
      { label: 'Partly', value: 'teilweise', icon: CircleDot },
      { label: 'Nothing yet', value: 'nichts', icon: Circle },
      { label: 'I don’t know', value: 'unbekannt', icon: HelpCircle },
    ],
    interstitial: {
      viel: 'Nice, you’ve already made a head start. Then let’s get the rest out.',
      nichts: 'No problem, that makes the first step especially effective.',
    },
  },
  priority: {
    id: 'priority',
    field: 'priority',
    message: 'And what matters most to you?',
    input: 'preset',
    options: [
      { label: 'Lower costs', value: 'kosten', icon: Coins },
      { label: 'More comfort', value: 'komfort', icon: Heart },
      { label: 'Less consumption', value: 'verbrauch', icon: Gauge },
      { label: 'All of it', value: 'alles', icon: Sparkles },
    ],
  },
}

// Dynamische Schrittfolge: gemeinsamer Anfang, danach Verzweigung nach Eigentumsstatus.
export function buildSequence(ownership: Ownership | null): StepId[] {
  const base: StepId[] = [
    'motivation',
    'ownership',
    'buildingType',
    'constructionPeriod',
    'livingArea',
    'plz',
    'heating',
  ]
  if (ownership === 'mieter') return [...base, 'landlordRelation']
  if (ownership === 'eigentuemer') return [...base, 'insulation', 'budget']
  return base
}

// Verkürzte Sequenz nach dem Formular-Interface (Haustyp/Heizung/Fläche/Baujahr
// wurden dort bereits erfasst). Nur noch Eigentum, PLZ und profilspezifische Fragen.
export function buildPostFormSequence(ownership: Ownership | null): StepId[] {
  const base: StepId[] = ['ownership', 'plz']
  if (ownership === 'mieter') return [...base, 'landlordRelation']
  if (ownership === 'eigentuemer') return [...base, 'insulation', 'budget']
  return base
}

/**
 * Kontextfragen für Phase 2 (nach Adresse + Datenbank-Abgleich).
 *
 * Eigentum, Haustyp und PLZ stammen aus Phase 1 und werden NICHT erneut gefragt.
 * Felder, die der DB-Abgleich bereits liefert (z.B. Baujahr/Periode via ETHOS),
 * werden übersprungen (kuratierter Pool + deterministische Skip-Logik).
 */
export function buildContextSequence(
  profile: UserProfile,
  building: EthosBuilding,
): StepId[] {
  // Kuratierter Pool, thematisch gegliedert für einen längeren, beratenden Verlauf:
  //  1) Gebäude/Technik  2) Verbrauch & Kosten  3) Bestand  4) Bedürfnis
  //  5) profilspezifischer Abschluss (Mieter vs. Eigentümer).
  const pool: StepId[] = [
    'heating',
    'livingArea',
    'constructionPeriod',
    'monthlyCost',
    'existingMeasures',
    'priority',
  ]
  if (profile.ownership === 'mieter') pool.push('landlordRelation')
  if (profile.ownership === 'eigentuemer') pool.push('insulation', 'budget')

  // Felder, die bereits bekannt sind: aus dem DB-Abgleich + aus Phase 1.
  const known = new Set<keyof UserProfile>(building.knownFields)
  return pool.filter((id) => {
    const field = STEPS[id].field
    // Schon vom Nutzer beantwortet?
    if (profile[field] !== null && profile[field] !== undefined && (profile[field] as unknown) !== '')
      return false
    // Schon durch Datenbank-Abgleich gedeckt?
    if (known.has(field)) return false
    return true
  })
}

// Filler words ignored during keyword matching of free text.
const STOPWORDS = new Set([
  'i',
  'and',
  'or',
  'rather',
  'is',
  'the',
  'with',
  'we',
  'more',
  'about',
  'approx',
  'ca',
  'so',
  'a',
  'an',
  'of',
  'per',
  'to',
  'for',
  'my',
])

/**
 * Versucht, eine frei eingegebene Antwort auf eine Antwortoption des aktuellen
 * Schritts abzubilden (Misch-Modus: Buttons ODER Freitext). Strategie:
 *  1) Zahl-basierte Schritte (Wohnfläche, Monatskosten) über den Betrag zuordnen.
 *  2) Sonst Stichwort-Abgleich gegen die Option-Labels.
 * Gibt null zurück, wenn keine eindeutige Zuordnung möglich ist.
 */
export function matchFreeTextToOption(
  step: Step,
  text: string,
): { value: string | number; label: string } | null {
  if (step.input !== 'preset' || !step.options) return null
  const t = text.toLowerCase().trim()
  const num = t.match(/(\d{2,4})/)

  // 1) Wohnfläche: genannte Quadratmeter auf die nächste Option runden.
  if (step.id === 'livingArea' && num) {
    const n = parseInt(num[1], 10)
    let best = step.options[0]
    for (const o of step.options) {
      if (Math.abs(Number(o.value) - n) < Math.abs(Number(best.value) - n)) best = o
    }
    return { value: best.value, label: best.label }
  }

  // 2) Monatliche Kosten: genannten Euro-Betrag in die passende Spanne einsortieren.
  if (step.id === 'monthlyCost' && num) {
    const n = parseInt(num[1], 10)
    const bucket = n < 100 ? 'unter_100' : n <= 150 ? '100_150' : n <= 250 ? '150_250' : 'ueber_250'
    const o = step.options.find((o) => o.value === bucket)
    if (o) return { value: o.value, label: o.label }
  }

  // 3) Stichwort-Abgleich gegen die Labels (frühe Optionen haben Vorrang).
  for (const o of step.options) {
    const lbl = o.label.toLowerCase()
    if (lbl.length >= 2 && t.includes(lbl)) return { value: o.value, label: o.label }
    const tokens = lbl
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
    if (tokens.some((w) => t.includes(w))) return { value: o.value, label: o.label }
  }

  // 4) Direkter Wert-Treffer (z.B. "gas").
  for (const o of step.options) {
    if (t.includes(String(o.value).toLowerCase())) return { value: o.value, label: o.label }
  }

  return null
}
