import type { BuildingType, Ownership } from './types'
import { DEFAULT_AREA, ELECTRICITY_PRICE, TABULA, heatPriceEuro } from './tabula'
import { plzRegionLabel } from './ethos'

// Realistisches, regionales Einsparpotenzial für den Phase-1-Catcher.
// In Phase 1 kennen wir nur Eigentum, Haustyp und PLZ, aber Baujahr/Heizung/Fläche
// noch nicht. Wir rechnen daher mit dem typischen (unsanierten) Bestand des
// Haustyps und konservativen, adressierbaren Anteilen.
const SAVINGS_FACTOR: Record<Ownership, number> = {
  mieter: 0.25, // Mieter:innen: v.a. Verhalten, Geräte, Tarif, Kleinmaßnahmen
  eigentuemer: 0.45, // Eigentümer:innen: zusätzlich bauliche Hebel
}

export interface RegionalEstimate {
  regionLabel: string
  demandIst: number
  demandSoll: number
  area: number
  currentCostEuro: number
  savingsMin: number
  savingsMax: number
  savingsMid: number
}

export function estimateRegionalSavings(
  ownership: Ownership,
  buildingType: BuildingType,
  plz: string,
): RegionalEstimate {
  // Periode "unbekannt" = repräsentativer Mix des Bestands (Baujahr noch nicht erfragt).
  const ref = TABULA[buildingType].unbekannt
  const area = DEFAULT_AREA[buildingType]

  // Aktuelle Energiekosten: Heizung (Gas-Default) + Haushaltsstrom.
  const heatCost = ref.ist * area * heatPriceEuro(null)
  const elecKwh = Math.max(1400, Math.min(4200, area * 22))
  const elecCost = elecKwh * ELECTRICITY_PRICE
  const currentCostEuro = Math.round(heatCost + elecCost)

  // Einsparpotenzial als Spanne um den Faktor (±20 %), kaufmännisch auf 10er gerundet.
  const factor = SAVINGS_FACTOR[ownership]
  const mid = currentCostEuro * factor
  const round10 = (n: number) => Math.round(n / 10) * 10
  const savingsMin = round10(mid * 0.8)
  const savingsMax = round10(mid * 1.2)
  const savingsMid = round10(mid)

  return {
    regionLabel: plzRegionLabel(plz),
    demandIst: ref.ist,
    demandSoll: ref.soll,
    area,
    currentCostEuro,
    savingsMin,
    savingsMax,
    savingsMid,
  }
}
