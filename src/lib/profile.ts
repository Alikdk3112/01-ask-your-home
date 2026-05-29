import type { ProfileType, UserProfile } from './types'

// Featured-Maßnahmen je Profil – bestimmt die Reihenfolge im Plan.
// Abgeleitet aus chain.py (profilspezifischer Output) + massnahmen_matrix.json (Beispiele).
export const FEATURED: Record<ProfileType, string[]> = {
  M1: ['M03', 'M01', 'M18', 'M07', 'M16'], // Quick-Win-Mieter + Vermieter-Brief
  M2: ['M03', 'M01', 'M18', 'M08', 'M07'], // Solo-Mieter, alles selbst umsetzbar
  M3: ['M03', 'M05', 'M07', 'M17', 'M04'], // Neubau-Mieter, Strom-Fokus
  E1: ['M13', 'M12', 'M11', 'M09', 'M14'], // Komplett-Sanierer
  E2: ['M15', 'M13', 'M14', 'M09', 'M04'], // Optimierer
  E3: ['M03', 'M01', 'M15', 'M04', 'M05'], // Einsteiger, niedrigschwellig
  E4: ['M14', 'M07', 'M13', 'M15', 'M04'], // Solar-Kandidat, PV zuerst
}

export const PROFILE_LABEL: Record<ProfileType, string> = {
  M1: 'Quick-Win Tenant',
  M2: 'Solo Tenant',
  M3: 'New-Build Tenant',
  E1: 'Full Renovator',
  E2: 'Optimizer',
  E3: 'Beginner',
  E4: 'Solar Candidate',
}

// Profile-specific opening line in the plan (house perspective).
export const PROFILE_INTRO: Record<ProfileType, string> = {
  M1: 'As a quick-win tenant you have more leverage than you think, even without your landlord’s permission.',
  M2: 'No problem, there’s plenty you can do entirely on your own.',
  M3: 'I’m already in pretty good shape, your biggest potential is in electricity.',
  E1: 'You have the biggest savings potential of all, and the state chips in up to 70%.',
  E2: 'I’m halfway there. With targeted upgrades you’ll get the most out of me.',
  E3: 'Starting small is perfectly fine. These steps cost little and pay off right away.',
  E4: 'My roof is made for solar, that’s our clear next step.',
}

function classifyMieter(p: UserProfile): ProfileType {
  if (p.constructionPeriod === 'nach_2010') return 'M3'
  if (p.landlordRelation === 'gut' || p.landlordRelation === 'geht_so') return 'M1'
  return 'M2'
}

function classifyEigentuemer(p: UserProfile): ProfileType {
  const altbau = p.constructionPeriod === 'vor_1978' || p.constructionPeriod === '1978_1995'
  const fossil = p.heating === 'gas' || p.heating === 'oel'
  const ungedaemmt = p.insulation === 'nein' || p.insulation === 'unbekannt'
  const solarTauglich =
    p.buildingType === 'efh' || p.buildingType === 'reihenhaus' || p.buildingType === 'villa'

  // E1: Komplett-Sanierer – altes, ungedämmtes Haus mit fossiler Heizung und großem Budget.
  if (altbau && fossil && ungedaemmt && p.budget === 'ueber_10k') return 'E1'

  // E4: Solar-Kandidat – passendes Dach + Wärmepumpe oder Nachhaltigkeits-Motivation.
  if (solarTauglich && (p.heating === 'waermepumpe' || p.motivation === 'nachhaltigkeit')) return 'E4'

  // E2: Optimierer – teilsaniert, mittleres Baualter oder mittleres Budget.
  if (p.insulation === 'teilweise' || p.constructionPeriod === '1995_2010' || p.budget === '2k_10k')
    return 'E2'

  // E3: Einsteiger (Default).
  return 'E3'
}

export function classifyProfile(p: UserProfile): ProfileType {
  return p.ownership === 'mieter' ? classifyMieter(p) : classifyEigentuemer(p)
}
