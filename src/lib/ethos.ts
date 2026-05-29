import type { BuildingType, EthosBuilding, EthosResult, Period } from './types'
import ethosRaw from './ethos_compact.json'
import { BUILDING_LABEL, DEFAULT_AREA, PERIOD_LABEL, periodFromYear } from './tabula'

// ETHOS.BUILDA Sample DE5 (Region Bremen) – verdichtetes ~1km-Geo-Grid.
interface Cell {
  n: number
  median_year: number
  dom_type: string
  period: string
  period_label: string
  refurb_pct: number
}
const data = ethosRaw as unknown as { cells: Record<string, Cell> }

const CELLS: { lat: number; lon: number; c: Cell }[] = Object.entries(data.cells).map(
  ([key, c]) => {
    const [lat, lon] = key.split(',').map(Number)
    return { lat, lon, c }
  },
)

// ETHOS dom_type → unsere BuildingType-Taxonomie.
function mapDomType(t: string): BuildingType {
  switch (t) {
    case 'SFH':
      return 'efh'
    case 'TH':
      return 'reihenhaus'
    case 'MFH':
    case 'AB':
      return 'mfh'
    default:
      return 'mfh'
  }
}

// PLZ-Zentroide für die Bremen-Region (ETHOS-Detaildaten vorhanden).
const PLZ_COORDS: Record<string, [number, number]> = {
  '28203': [53.07, 8.83],
  '28195': [53.08, 8.8],
  '28199': [53.06, 8.8],
  '28259': [53.04, 8.74],
  '28355': [53.08, 8.93],
  '28357': [53.1, 8.9],
  '28717': [53.18, 8.64],
  '28759': [53.18, 8.64],
  '27568': [53.55, 8.58],
  '27576': [53.55, 8.58],
}

function bremenFallbackCoord(plz: string): [number, number] | null {
  if (plz.startsWith('28')) return [53.08, 8.8] // Bremen-Zentrum
  if (plz.startsWith('27')) return [53.55, 8.58] // Bremerhaven/Nordwest
  return null
}

// Grobe PLZ → Region/Bundesland-Labels (für die Erzählung des Hauses).
const REGION_LABEL: { prefix: string; label: string }[] = [
  { prefix: '28', label: 'Bremen' },
  { prefix: '27', label: 'Bremen/Northwest' },
  { prefix: '60', label: 'Frankfurt am Main' },
  { prefix: '61', label: 'Frankfurt/Rhine-Main' },
  { prefix: '63', label: 'Offenbach/Rhine-Main' },
  { prefix: '65', label: 'Wiesbaden' },
  { prefix: '10', label: 'Berlin' },
  { prefix: '12', label: 'Berlin' },
  { prefix: '20', label: 'Hamburg' },
  { prefix: '22', label: 'Hamburg' },
  { prefix: '80', label: 'Munich' },
  { prefix: '81', label: 'Munich' },
  { prefix: '50', label: 'Cologne' },
  { prefix: '70', label: 'Stuttgart' },
  { prefix: '40', label: 'Düsseldorf' },
  { prefix: '90', label: 'Nuremberg' },
  { prefix: '04', label: 'Leipzig' },
  { prefix: '01', label: 'Dresden' },
  { prefix: '30', label: 'Hanover' },
]

const BUNDESLAND_BY_FIRST: Record<string, string> = {
  '0': 'Saxony/Central Germany',
  '1': 'Berlin/Brandenburg',
  '2': 'Northern Germany',
  '3': 'Lower Saxony/Hesse',
  '4': 'North Rhine-Westphalia',
  '5': 'Rhineland',
  '6': 'Hesse/Rhine-Main',
  '7': 'Baden-Württemberg',
  '8': 'Bavaria (South)',
  '9': 'Bavaria (North)',
}

export function plzRegionLabel(plz: string): string {
  for (const r of REGION_LABEL) {
    if (plz.startsWith(r.prefix)) return r.label
  }
  return BUNDESLAND_BY_FIRST[plz[0]] ?? 'your region'
}

export function isValidPlz(plz: string): boolean {
  return /^\d{5}$/.test(plz)
}

/**
 * Lookup: PLZ → Gebäudestatistik. Für die Bremen-Region echte ETHOS-Grid-Daten,
 * sonst ein Bundesland-Label (found=false → Flow fragt Typ/Baujahr normal ab).
 */
export function ethosLookup(plz: string): EthosResult {
  const region = plzRegionLabel(plz)
  const ortLabel = `${plz} ${region}`.trim()

  const coord = PLZ_COORDS[plz] ?? bremenFallbackCoord(plz)
  if (coord) {
    const [lat, lon] = coord
    let best: { d: number; cell: Cell } | null = null
    for (const cell of CELLS) {
      const d = (cell.lat - lat) ** 2 + (cell.lon - lon) ** 2
      if (!best || d < best.d) best = { d, cell: cell.c }
    }
    // ~0.08° ≈ 6 km Radius
    if (best && best.d < 0.0064) {
      const c = best.cell
      return {
        found: true,
        source: 'ethos-grid',
        ortLabel,
        buildingCount: c.n,
        medianYear: c.median_year,
        domType: mapDomType(c.dom_type),
        periodLabel: c.period_label,
        refurbPct: c.refurb_pct,
      }
    }
  }

  return {
    found: false,
    source: 'bundesland',
    ortLabel,
    buildingCount: null,
    medianYear: null,
    domType: null,
    periodLabel: null,
    refurbPct: null,
  }
}

/**
 * Adress-/Datenbank-Abgleich für Phase 2 (Schritt 2).
 *
 * Liefert den Gebäude-Kontext, mit dem sich das Haus vorstellt und auf dessen
 * Basis die KI bereits bekannte Folgefragen überspringt:
 *  - Region mit echten ETHOS-Grid-Daten (z.B. Bremen): konkretes Median-Baujahr
 *    + dominanter Gebäudetyp aus dem ~1km-Raster → matched=true.
 *  - Sonst: Rückfall auf die TABULA-Typologie (Baujahr bleibt offen → wird in
 *    Phase 2 als kuratierte Frage erhoben).
 *
 * Die Nutzerangabe aus Phase 1 (buildingType) hat Vorrang vor dem dominanten
 * Regionstyp, damit die Daten über beide Phasen konsistent bleiben.
 */
export function ethosBuildingMatch(plz: string, userType: BuildingType | null): EthosBuilding {
  const e = ethosLookup(plz)
  const buildingType: BuildingType = userType ?? e.domType ?? 'mfh'

  if (e.found && e.medianYear) {
    const period: Period = periodFromYear(e.medianYear)
    return {
      matched: true,
      source: 'ethos-grid',
      baujahr: e.medianYear,
      period,
      buildingType,
      livingArea: DEFAULT_AREA[buildingType],
      archetypLabel: `${BUILDING_LABEL[buildingType]}, built ~${e.medianYear} (${PERIOD_LABEL[period]})`,
      // Baujahr/Periode aus DB bekannt → in Phase 2 nicht mehr abfragen.
      knownFields: ['constructionPeriod'],
    }
  }

  // Kein Treffer im Detail-Raster: nur der Haustyp aus Phase 1 ist gesichert.
  return {
    matched: false,
    source: 'typologie',
    baujahr: null,
    period: null,
    buildingType,
    livingArea: null,
    archetypLabel: BUILDING_LABEL[buildingType],
    knownFields: [],
  }
}
