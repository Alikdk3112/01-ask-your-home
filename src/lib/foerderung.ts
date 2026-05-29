import type { Heating, Ownership } from './types'
import type { Massnahme } from './massnahmen'

// Kontext für die Förderhöhe (Bonusse hängen an Eigentum + alter Heizung).
export interface FoerderContext {
  ownership: Ownership
  heating: Heating | null
  hatIsfp?: boolean // individueller Sanierungsfahrplan → +5 % BAFA
}

export interface FoerderResult {
  programm: string | null
  pct: number
  euro: number
  hinweis: string | null
}

const NONE: FoerderResult = { programm: null, pct: 0, euro: 0, hinweis: null }

function round(n: number): number {
  return Math.round(n)
}

/**
 * Konkrete Förderung für eine Maßnahme bei gegebener Investition.
 * Portiert aus logic.py (_berechne_foerderung_impl), aber mit expliziter
 * Förderschiene je Maßnahme statt Namens-Matching.
 */
export function berechneFoerderung(
  m: Massnahme,
  investEuro: number,
  ctx: FoerderContext,
): FoerderResult {
  switch (m.foerderTyp) {
    case 'kfw458': {
      const selbstnutzer = ctx.ownership === 'eigentuemer'
      const alteFossile = ctx.heating === 'gas' || ctx.heating === 'oel'
      let pct = 30 // Grundförderung
      if (selbstnutzer && alteFossile) pct += 20 // Klimageschwindigkeits-Bonus
      // Einkommens-Bonus (+30 %) erfassen wir im Flow nicht → konservativ weglassen.
      pct = Math.min(pct, selbstnutzer ? 70 : 35)
      const foerderfaehig = Math.min(investEuro, 30000)
      const euro = Math.min(round((foerderfaehig * pct) / 100), m.foerderMaxEuro ?? 21000)
      return {
        programm: 'KfW 458 (heating grant)',
        pct,
        euro,
        hinweis: 'You must apply BEFORE signing the contract with the installer.',
      }
    }
    case 'kfw270': {
      return {
        programm: 'KfW 270 (low-interest loan)',
        pct: 0,
        euro: 0,
        hinweis: 'Not a direct grant, but very favorable loan terms.',
      }
    }
    case 'bafa_huelle': {
      const pct = ctx.hatIsfp ? 20 : 15
      const basisCap = ctx.hatIsfp ? 60000 : 30000
      const foerderfaehig = Math.min(investEuro, basisCap)
      const euro = Math.min(round((foerderfaehig * pct) / 100), m.foerderMaxEuro ?? Infinity)
      return {
        programm: 'BAFA BEG individual measures',
        pct,
        euro,
        hinweis: ctx.hatIsfp
          ? 'Apply at BAFA BEFORE starting the work.'
          : 'With an individual renovation roadmap (iSFP) the grant rises to 20%.',
      }
    }
    case 'bafa_anlage': {
      const pct = 15
      const foerderfaehig = Math.min(investEuro, 30000)
      const euro = Math.min(round((foerderfaehig * pct) / 100), m.foerderMaxEuro ?? 4500)
      return {
        programm: 'BAFA BEG (heating optimization)',
        pct,
        euro,
        hinweis: 'Apply at BAFA BEFORE starting the work.',
      }
    }
    case 'balkon': {
      const euro = Math.min(200, investEuro) // conservative municipal average
      const pct = investEuro > 0 ? round((euro / investEuro) * 100) : 0
      return {
        programm: 'Municipal grant',
        pct,
        euro,
        hinweis: 'Grant varies by municipality (€100–500). Check with your city before buying.',
      }
    }
    default:
      return NONE
  }
}
