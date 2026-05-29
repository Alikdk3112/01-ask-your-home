import type { BuildingType, Period, Heating } from './types'

// Heizwärmebedarf (kWh/m²a, Endenergie) nach TABULA/EPISCOPE-Gebäudetypologie.
// ist = unsaniert (Status quo), soll = heutiger Effizienzstandard.
// Quelle: TABULA Deutschland + Heizspiegel 2025 (verdichtet).
interface Ref {
  ist: number
  soll: number
}

export const TABULA: Record<BuildingType, Record<Period, Ref>> = {
  efh: {
    vor_1978: { ist: 220, soll: 110 },
    '1978_1995': { ist: 160, soll: 95 },
    '1995_2010': { ist: 110, soll: 70 },
    nach_2010: { ist: 60, soll: 50 },
    unbekannt: { ist: 170, soll: 95 },
  },
  mfh: {
    vor_1978: { ist: 200, soll: 120 },
    '1978_1995': { ist: 150, soll: 100 },
    '1995_2010': { ist: 100, soll: 70 },
    nach_2010: { ist: 65, soll: 55 },
    unbekannt: { ist: 150, soll: 95 },
  },
  villa: {
    vor_1978: { ist: 240, soll: 120 },
    '1978_1995': { ist: 180, soll: 105 },
    '1995_2010': { ist: 120, soll: 75 },
    nach_2010: { ist: 65, soll: 50 },
    unbekannt: { ist: 185, soll: 100 },
  },
  reihenhaus: {
    vor_1978: { ist: 190, soll: 100 },
    '1978_1995': { ist: 140, soll: 90 },
    '1995_2010': { ist: 95, soll: 65 },
    nach_2010: { ist: 55, soll: 45 },
    unbekannt: { ist: 150, soll: 90 },
  },
}

export const BUILDING_LABEL: Record<BuildingType, string> = {
  efh: 'Single-family house',
  mfh: 'Apartment building',
  villa: 'Villa',
  reihenhaus: 'Terraced house',
}

export const PERIOD_LABEL: Record<Period, string> = {
  vor_1978: 'before 1978',
  '1978_1995': '1978–1995',
  '1995_2010': '1995–2010',
  nach_2010: 'after 2010',
  unbekannt: 'estimated',
}

// Mittlere Wohnfläche je Typ (Fallback, wenn Nutzer keine Angabe macht).
export const DEFAULT_AREA: Record<BuildingType, number> = {
  efh: 130,
  mfh: 72,
  villa: 200,
  reihenhaus: 110,
}

// Endenergiepreise (€/kWh). Wärmepumpe = effektiv mit COP. Quelle: Heizspiegel 2025.
export function heatPriceEuro(h: Heating | null): number {
  switch (h) {
    case 'oel':
      return 0.1
    case 'fernwaerme':
      return 0.167
    case 'waermepumpe':
      return 0.1
    case 'strom':
      return 0.3
    default:
      return 0.115 // Gas / unbekannt
  }
}

export const ELECTRICITY_PRICE = 0.37 // €/kWh Haushaltsstrom

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function getRef(type: BuildingType, period: Period): Ref {
  return TABULA[type][period]
}

// Periode aus konkretem Baujahr (z.B. aus ETHOS-Median) ableiten.
export function periodFromYear(year: number | null | undefined): Period {
  if (!year) return 'unbekannt'
  if (year < 1978) return 'vor_1978'
  if (year < 1995) return '1978_1995'
  if (year < 2010) return '1995_2010'
  return 'nach_2010'
}
