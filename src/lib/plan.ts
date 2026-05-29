import type {
  BuildingType,
  EnergyPlan,
  EthosResult,
  Period,
  PlanMeasure,
  UserProfile,
} from './types'
import {
  BUILDING_LABEL,
  DEFAULT_AREA,
  ELECTRICITY_PRICE,
  PERIOD_LABEL,
  clamp,
  getRef,
  heatPriceEuro,
  periodFromYear,
} from './tabula'
import { MASSNAHMEN, type Massnahme } from './massnahmen'
import { berechneFoerderung, type FoerderContext } from './foerderung'
import { FEATURED, PROFILE_LABEL, classifyProfile } from './profile'

// Repräsentatives Baujahr je Periode (für baujahr-abhängige Maßnahmen-Filter).
const PERIOD_YEAR: Record<Period, number> = {
  vor_1978: 1970,
  '1978_1995': 1986,
  '1995_2010': 2002,
  nach_2010: 2015,
  unbekannt: 1990,
}

// Anteil der Energiekosten, der realistisch adressierbar ist (Sicherheits-Cap).
const SAVINGS_CAP: Record<'mieter' | 'eigentuemer', number> = {
  mieter: 0.25,
  eigentuemer: 0.5,
}

interface ResolvedBuilding {
  type: BuildingType
  period: Period
  area: number
}

// Profil + ETHOS zu Typ/Periode/Fläche auflösen (Nutzerangabe schlägt ETHOS schlägt Default).
function resolveBuilding(profile: UserProfile, ethos: EthosResult): ResolvedBuilding {
  const type = profile.buildingType ?? ethos.domType ?? 'mfh'
  let period: Period = 'unbekannt'
  if (profile.constructionPeriod && profile.constructionPeriod !== 'unbekannt') {
    period = profile.constructionPeriod
  } else if (ethos.medianYear) {
    period = periodFromYear(ethos.medianYear)
  }
  const area = profile.livingArea ?? DEFAULT_AREA[type]
  return { type, period, area }
}

function applicable(m: Massnahme, profile: UserProfile, repYear: number): boolean {
  if (!m.zielgruppe.includes(profile.ownership ?? 'eigentuemer')) return false
  if (m.baujahrRelevantBis !== null && repYear > m.baujahrRelevantBis) return false
  return true
}

// €-Einsparung/Jahr einer Maßnahme, skaliert mit den realen Kosten des Hauses.
function measureEuro(m: Massnahme, heatCost: number, elecCost: number): [number, number] {
  let lo = 0
  let hi = 0
  if (m.einsparPctHeiz) {
    lo = (m.einsparPctHeiz[0] / 100) * heatCost
    hi = (m.einsparPctHeiz[1] / 100) * heatCost
  } else if (m.einsparPctStrom) {
    lo = (m.einsparPctStrom[0] / 100) * elecCost
    hi = (m.einsparPctStrom[1] / 100) * elecCost
  } else if (m.einsparEuroJahr) {
    return m.einsparEuroJahr
  } else {
    return [0, 0]
  }
  // In den statischen Korridor klemmen, damit kein Wert aus dem Ruder läuft.
  if (m.einsparEuroJahr) {
    const [sMin, sMax] = m.einsparEuroJahr
    lo = clamp(lo, sMin * 0.6, sMax * 1.6)
    hi = clamp(hi, sMin * 0.6, sMax * 1.6)
  }
  return [Math.round(lo), Math.round(hi)]
}

interface Scored {
  m: Massnahme
  savedMin: number
  savedMax: number
  rank: number
}

export function buildPlan(profile: UserProfile, ethos: EthosResult): EnergyPlan {
  const { type, period, area } = resolveBuilding(profile, ethos)
  const ref = getRef(type, period)

  // Aktuelle Energiekosten (Heizung nach TABULA-IST + Haushaltsstrom).
  const heatCost = ref.ist * area * heatPriceEuro(profile.heating)
  const elecKwh = clamp(area * 22, 1400, 4200)
  const elecCost = elecKwh * ELECTRICITY_PRICE
  const currentEnergyCostEuro = Math.round(heatCost + elecCost)

  const profilTyp = classifyProfile(profile)
  const featured = FEATURED[profilTyp]
  const repYear = PERIOD_YEAR[period]
  const ctx: FoerderContext = {
    ownership: profile.ownership ?? 'eigentuemer',
    heating: profile.heating,
  }

  // Kandidaten filtern + bewerten.
  const scored: Scored[] = MASSNAHMEN.filter((m) => applicable(m, profile, repYear)).map((m) => {
    const [savedMin, savedMax] = measureEuro(m, heatCost, elecCost)
    const featuredIdx = featured.indexOf(m.id)
    // Featured-Maßnahmen IMMER zuerst (in Listenreihenfolge), erst danach der Rest
    // nach Kosten-Nutzen. Das Rest-Band (≥1000) liegt strikt über allen Featured-
    // Indizes (0–n), damit z.B. eine investitionsfreie Maßnahme mit Top-ROI keine
    // wichtige Featured-Maßnahme (etwa den Vermieter-Brief) aus den Top 5 verdrängt.
    const investMid = (m.investEuro[0] + m.investEuro[1]) / 2
    const savedMid = (savedMin + savedMax) / 2
    const kostenNutzen = savedMid / Math.max(investMid, 1)
    const rank = featuredIdx >= 0 ? featuredIdx : 1000 - Math.min(kostenNutzen, 99)
    return { m, savedMin, savedMax, rank }
  })

  scored.sort((a, b) => a.rank - b.rank)
  const top = scored.slice(0, 5)

  // Cap: Gesamteinsparung darf einen Anteil der Energiekosten nicht übersteigen.
  const rawSumMax = top.reduce((s, x) => s + x.savedMax, 0)
  const cap = SAVINGS_CAP[profile.ownership ?? 'eigentuemer'] * currentEnergyCostEuro
  const factor = rawSumMax > cap && rawSumMax > 0 ? cap / rawSumMax : 1

  const measures: PlanMeasure[] = top.map((x) => {
    const m = x.m
    const investMid = (m.investEuro[0] + m.investEuro[1]) / 2
    const foerder = berechneFoerderung(m, investMid, ctx)
    const savedEuroMin = Math.round(x.savedMin * factor)
    const savedEuroMax = Math.round(x.savedMax * factor)
    return {
      id: m.id,
      name: m.name,
      kategorie: m.kategorie,
      houseVoice: m.houseVoice,
      beschreibung: m.beschreibung,
      savedEuroMin,
      savedEuroMax,
      investMin: m.investEuro[0],
      investMax: m.investEuro[1],
      foerderProgramm: foerder.programm,
      foerderEuro: foerder.euro,
      eigenanteilMin: Math.max(m.investEuro[0] - foerder.euro, 0),
      eigenanteilMax: Math.max(m.investEuro[1] - foerder.euro, 0),
      co2Min: m.co2[0],
      co2Max: m.co2[1],
      aufwand: m.aufwand,
      kenergyCta: m.kenergyCta,
      provider: m.provider ?? null,
      briefVorlage: m.briefVorlage,
      hinweis: m.hinweis,
      foerderHinweis: foerder.hinweis,
    }
  })

  const estimatedSavingsMin = measures.reduce((s, x) => s + x.savedEuroMin, 0)
  const estimatedSavingsMax = measures.reduce((s, x) => s + x.savedEuroMax, 0)
  const co2SavingsKg = Math.round(
    measures.reduce((s, x) => s + ((x.co2Min + x.co2Max) / 2) * factor, 0),
  )
  const totalInvestMin = measures.reduce((s, x) => s + x.investMin, 0)
  const totalInvestMax = measures.reduce((s, x) => s + x.investMax, 0)
  const totalFoerder = measures.reduce((s, x) => s + x.foerderEuro, 0)

  const pctOverStandard = Math.round(((ref.ist - ref.soll) / ref.ist) * 100)

  return {
    profilTyp,
    profilLabel: PROFILE_LABEL[profilTyp],
    archetypLabel: `${BUILDING_LABEL[type]}, ${PERIOD_LABEL[period]}`,
    demandIst: ref.ist,
    demandSoll: ref.soll,
    pctOverStandard,
    currentEnergyCostEuro,
    estimatedSavingsMin,
    estimatedSavingsMax,
    co2SavingsKg,
    measures,
    totalInvestMin,
    totalInvestMax,
    totalFoerder,
    hasKenergy: measures.some((m) => m.kenergyCta !== null),
    vermieterBrief: measures.some((m) => m.briefVorlage),
  }
}
