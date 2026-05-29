// Zentrale Typen für "Frag dein Zuhause".

export type Motivation = 'heizkosten' | 'strom' | 'nachhaltigkeit' | 'alles'
export type Ownership = 'mieter' | 'eigentuemer'
export type BuildingType = 'efh' | 'mfh' | 'villa' | 'reihenhaus'
export type Period = 'vor_1978' | '1978_1995' | '1995_2010' | 'nach_2010' | 'unbekannt'
export type Heating = 'gas' | 'oel' | 'fernwaerme' | 'waermepumpe' | 'strom' | 'unbekannt'
export type LandlordRelation = 'gut' | 'geht_so' | 'schwierig' | 'hausverwaltung'
export type Insulation = 'ja' | 'teilweise' | 'nein' | 'unbekannt'
export type Budget = 'unter_500' | '500_2k' | '2k_10k' | 'ueber_10k' | 'informieren'
// Zusätzliche Kontextfelder für den vertiefenden Dialog in Phase 2.
export type MonthlyCost = 'unter_100' | '100_150' | '150_250' | 'ueber_250' | 'unbekannt'
export type ExistingMeasures = 'viel' | 'teilweise' | 'nichts' | 'unbekannt'
export type Priority = 'kosten' | 'komfort' | 'verbrauch' | 'alles'

export type ProfileType = 'M1' | 'M2' | 'M3' | 'E1' | 'E2' | 'E3' | 'E4'

export interface UserProfile {
  motivation: Motivation | null
  ownership: Ownership | null
  buildingType: BuildingType | null
  constructionPeriod: Period | null
  livingArea: number | null
  // Adresse: plz + ort kommen aus Phase 1 und bleiben über Phase 2 hinweg konsistent.
  plz: string | null
  ort: string | null
  street: string | null
  houseNumber: string | null
  heating: Heating | null
  landlordRelation: LandlordRelation | null
  insulation: Insulation | null
  budget: Budget | null
  monthlyCost: MonthlyCost | null
  existingMeasures: ExistingMeasures | null
  priority: Priority | null
  freeText: string[]
}

export function emptyProfile(): UserProfile {
  return {
    motivation: null,
    ownership: null,
    buildingType: null,
    constructionPeriod: null,
    livingArea: null,
    plz: null,
    ort: null,
    street: null,
    houseNumber: null,
    heating: null,
    landlordRelation: null,
    insulation: null,
    budget: null,
    monthlyCost: null,
    existingMeasures: null,
    priority: null,
    freeText: [],
  }
}

/**
 * Ergebnis des Adress-/Datenbank-Abgleichs (Phase 2, Schritt 2).
 * Liefert den Gebäude-Kontext, den die KI nutzt und der bereits bekannte
 * Folgefragen überflüssig macht (skip-Logik in flow.ts).
 */
export interface EthosBuilding {
  matched: boolean
  source: 'ethos-grid' | 'typologie'
  baujahr: number | null
  period: Period | null
  buildingType: BuildingType | null
  livingArea: number | null
  archetypLabel: string
  // Welche Profilfelder durch den Abgleich bereits gedeckt sind.
  knownFields: Array<keyof UserProfile>
}

export interface PlanMeasure {
  id: string
  name: string
  kategorie: 'sofort' | 'klein' | 'mittel' | 'gross'
  houseVoice: string
  beschreibung: string
  savedEuroMin: number
  savedEuroMax: number
  investMin: number
  investMax: number
  foerderProgramm: string | null
  foerderEuro: number
  eigenanteilMin: number
  eigenanteilMax: number
  co2Min: number
  co2Max: number
  aufwand: string
  kenergyCta: string | null
  provider: { name: string; url: string } | null
  briefVorlage: boolean
  // Zusätzlicher Detail-Hinweis (Maßnahme + Förderschiene) für die Karten-Detailansicht.
  hinweis: string | null
  foerderHinweis: string | null
}

export interface EnergyPlan {
  profilTyp: ProfileType
  profilLabel: string
  archetypLabel: string
  demandIst: number
  demandSoll: number
  pctOverStandard: number
  currentEnergyCostEuro: number
  estimatedSavingsMin: number
  estimatedSavingsMax: number
  co2SavingsKg: number
  measures: PlanMeasure[]
  totalInvestMin: number
  totalInvestMax: number
  totalFoerder: number
  hasKenergy: boolean
  vermieterBrief: boolean
}

// Ergebnis des ETHOS-Lookups (PLZ → Gebäudestatistik der Region)
export interface EthosResult {
  found: boolean
  source: 'ethos-grid' | 'bundesland'
  ortLabel: string
  buildingCount: number | null
  medianYear: number | null
  domType: BuildingType | null
  periodLabel: string | null
  refurbPct: number | null
}

// Antwort des /api/chat-Proxys
export interface ChatApiResult {
  content?: string
  error?: { kind: string; message: string; retryAfter?: number; raw?: string }
}
