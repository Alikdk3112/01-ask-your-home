import type { Ownership } from './types'

// Förderschiene einer Maßnahme – steuert die Berechnung in foerderung.ts.
export type Foerderart =
  | 'kfw458' // Heizungstausch (Wärmepumpe)
  | 'kfw270' // PV-Kredit
  | 'bafa_huelle' // Gebäudehülle (Dämmung, Fenster, Lüftung)
  | 'bafa_anlage' // Heizungsoptimierung / hydraulischer Abgleich
  | 'balkon' // kommunaler Balkonkraftwerk-Zuschuss
  | null

export type Kategorie = 'sofort' | 'klein' | 'mittel' | 'gross'

export interface Massnahme {
  id: string
  name: string
  kategorie: Kategorie
  zielgruppe: Ownership[]
  // Maßnahme nur relevant für Gebäude bis zu diesem Baujahr (null = immer).
  baujahrRelevantBis: number | null
  investEuro: [number, number]
  // Statischer €-Korridor; null = "variabel" (z.B. Vermieter-Brief).
  einsparEuroJahr: [number, number] | null
  einsparPctHeiz: [number, number] | null
  einsparPctStrom: [number, number] | null
  co2: [number, number]
  foerderTyp: Foerderart
  // €-Deckel des Zuschusses laut Matrix (null = nur prozentualer Deckel).
  foerderMaxEuro: number | null
  aufwand: string
  beschreibung: string
  // Ich-Perspektive des Hauses (zentrale UX-Mechanik).
  houseVoice: string
  kenergyCta: string | null
  briefVorlage: boolean
  hinweis: string | null
  // Direct outbound link to a provider/marketplace (monetization). Omit = no link.
  provider?: { name: string; url: string }
}

const BOTH: Ownership[] = ['mieter', 'eigentuemer']
const OWNER: Ownership[] = ['eigentuemer']
const TENANT: Ownership[] = ['mieter']

// Measures matrix (M01–M20) – ported from massnahmen_matrix.json.
// Sources: TABULA/EPISCOPE, Heizspiegel 2025, BAFA BEG 2026, KfW 458/270.
export const MASSNAHMEN: Massnahme[] = [
  {
    id: 'M01',
    name: 'Bleed the radiators',
    kategorie: 'sofort',
    zielgruppe: BOTH,
    baujahrRelevantBis: null,
    investEuro: [0, 50],
    einsparEuroJahr: [50, 150],
    einsparPctHeiz: [3, 8],
    einsparPctStrom: null,
    co2: [100, 300],
    foerderTyp: null,
    foerderMaxEuro: null,
    aufwand: '1–2 h, DIY',
    beschreibung:
      'Let the air out of the radiators and set the thermostatic valves correctly. The simplest measure with an immediate effect.',
    houseVoice:
      'My radiators gurgle and don’t get properly warm at the top. Bleed them once and I’ll heat efficiently again.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
  },
  {
    id: 'M02',
    name: 'Lower the heating at night',
    kategorie: 'sofort',
    zielgruppe: BOTH,
    baujahrRelevantBis: null,
    investEuro: [0, 0],
    einsparEuroJahr: [80, 200],
    einsparPctHeiz: [5, 10],
    einsparPctStrom: null,
    co2: [150, 400],
    foerderTyp: null,
    foerderMaxEuro: null,
    aufwand: 'Thermostat setting',
    beschreibung:
      'Night setback to 16–17 °C and a setback while you’re away. Programmable thermostats make this easy.',
    houseVoice:
      'At night I don’t need as much warmth as during the day. Turn me down a bit and I’ll save while you sleep.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
  },
  {
    id: 'M03',
    name: 'Switch electricity & gas provider',
    kategorie: 'sofort',
    zielgruppe: BOTH,
    baujahrRelevantBis: null,
    investEuro: [0, 0],
    einsparEuroJahr: [100, 400],
    einsparPctHeiz: [5, 15],
    einsparPctStrom: null,
    co2: [0, 500],
    foerderTyp: null,
    foerderMaxEuro: null,
    aufwand: '30 min online via a comparison site',
    beschreibung:
      'Switch to a cheaper tariff or green electricity. Especially on the default tariff this often saves several hundred euros.',
    houseVoice:
      'I think we’re paying too much for electricity and gas. Switching tariffs costs nothing and saves right away.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'Check24', url: 'https://www.check24.de/strom/' },
  },
  {
    id: 'M04',
    name: 'Smart thermostats',
    kategorie: 'klein',
    zielgruppe: BOTH,
    baujahrRelevantBis: null,
    investEuro: [150, 400],
    einsparEuroJahr: [100, 300],
    einsparPctHeiz: [5, 15],
    einsparPctStrom: null,
    co2: [200, 600],
    foerderTyp: null,
    foerderMaxEuro: null,
    aufwand: 'DIY, 15 min per radiator',
    beschreibung:
      'WiFi-enabled thermostats with scheduling, open-window detection and geofencing.',
    houseVoice:
      'My radiators sometimes heat unevenly. With smart thermostats we can get that under control.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'tado°', url: 'https://www.tado.com/' },
  },
  {
    id: 'M05',
    name: 'Switch to LED lighting',
    kategorie: 'klein',
    zielgruppe: BOTH,
    baujahrRelevantBis: null,
    investEuro: [80, 250],
    einsparEuroJahr: [60, 200],
    einsparPctHeiz: null,
    einsparPctStrom: [10, 25],
    co2: [50, 200],
    foerderTyp: null,
    foerderMaxEuro: null,
    aufwand: 'DIY, swap the bulbs',
    beschreibung:
      'Replace all incandescent and halogen bulbs with LEDs, 80–90% less power per bulb.',
    houseVoice:
      'My old bulbs waste electricity needlessly. LEDs save up to 80% per lamp.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'Idealo', url: 'https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=led+lampen' },
  },
  {
    id: 'M06',
    name: 'Seal doors & windows',
    kategorie: 'klein',
    zielgruppe: BOTH,
    baujahrRelevantBis: 1994,
    investEuro: [20, 100],
    einsparEuroJahr: [40, 120],
    einsparPctHeiz: [2, 6],
    einsparPctStrom: null,
    co2: [80, 240],
    foerderTyp: null,
    foerderMaxEuro: null,
    aufwand: 'DIY, 1–2 h',
    beschreibung:
      'Sealing strips on window frames and doors, a draft stopper on the front door. Especially effective in older buildings.',
    houseVoice:
      'There’s a draft at my windows and doors. A bit of sealing tape would fix that quickly.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'Amazon', url: 'https://www.amazon.de/s?k=dichtungsband+fenster' },
  },
  {
    id: 'M07',
    name: 'Balcony solar plant',
    kategorie: 'klein',
    zielgruppe: BOTH,
    baujahrRelevantBis: null,
    investEuro: [300, 800],
    einsparEuroJahr: [100, 280],
    einsparPctHeiz: null,
    einsparPctStrom: [10, 30],
    co2: [200, 500],
    foerderTyp: 'balkon',
    foerderMaxEuro: 500,
    aufwand: 'DIY + registration in the market data register',
    beschreibung:
      '800-watt system for a balcony, terrace or garden. A privileged measure under §554 BGB since 2024. The power is used directly in the household.',
    houseVoice:
      'I’ve got free space on a balcony or terrace, a small solar panel would fit perfectly there!',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'priwatt', url: 'https://priwatt.de/' },
  },
  {
    id: 'M08',
    name: 'Save hot water',
    kategorie: 'sofort',
    zielgruppe: BOTH,
    baujahrRelevantBis: null,
    investEuro: [10, 50],
    einsparEuroJahr: [60, 180],
    einsparPctHeiz: [3, 8],
    einsparPctStrom: null,
    co2: [100, 350],
    foerderTyp: null,
    foerderMaxEuro: null,
    aufwand: 'Fit a water-saving showerhead, 30 min',
    beschreibung:
      'Water-saving showerhead (7 L/min instead of 15 L), flow limiters on taps, wash laundry cold.',
    houseVoice:
      'I lose more on hot water than you’d think. A water-saving showerhead and I need noticeably less.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'Amazon', url: 'https://www.amazon.de/s?k=wassersparender+duschkopf' },
  },
  {
    id: 'M09',
    name: 'Attic / top-floor ceiling insulation',
    kategorie: 'mittel',
    zielgruppe: OWNER,
    baujahrRelevantBis: 2001,
    investEuro: [1500, 5000],
    einsparEuroJahr: [200, 500],
    einsparPctHeiz: [10, 20],
    einsparPctStrom: null,
    co2: [400, 1000],
    foerderTyp: 'bafa_huelle',
    foerderMaxEuro: 12000,
    aufwand: 'Contractor, 2–3 days',
    beschreibung:
      'Insulate the top-floor ceiling or roof slope (20 cm mineral wool). A very good cost-benefit ratio since heat rises.',
    houseVoice:
      'I lose the most heat through my roof. Some insulation would really do me good.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'Enter', url: 'https://enter.de/' },
  },
  {
    id: 'M10',
    name: 'Basement ceiling insulation',
    kategorie: 'mittel',
    zielgruppe: OWNER,
    baujahrRelevantBis: 1994,
    investEuro: [800, 3000],
    einsparEuroJahr: [100, 300],
    einsparPctHeiz: [5, 12],
    einsparPctStrom: null,
    co2: [200, 600],
    foerderTyp: 'bafa_huelle',
    foerderMaxEuro: 12000,
    aufwand: 'Contractor, 1–2 days',
    beschreibung:
      'Glue insulation boards under the basement ceiling. Reduces cold floors and heat loss downward.',
    houseVoice:
      'Cold creeps up from below, my basement ceiling is bare. A bit of insulation and my feet stay warm.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'Enter', url: 'https://enter.de/' },
  },
  {
    id: 'M11',
    name: 'Window replacement (triple glazing)',
    kategorie: 'gross',
    zielgruppe: OWNER,
    baujahrRelevantBis: 2001,
    investEuro: [8000, 25000],
    einsparEuroJahr: [200, 700],
    einsparPctHeiz: [10, 25],
    einsparPctStrom: null,
    co2: [400, 1400],
    foerderTyp: 'bafa_huelle',
    foerderMaxEuro: 12000,
    aufwand: 'Specialist, 2–5 days',
    beschreibung:
      'Replace old windows with triple glazing. The Uw value drops from ~2.8 to ~0.9 W/m²K and also improves sound insulation.',
    houseVoice:
      'Heat escapes through my old windows. Triple glazing would make me really tight.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: 'Always plan together with a ventilation concept, otherwise there’s a risk of mold.',
    provider: { name: 'Enter', url: 'https://enter.de/' },
  },
  {
    id: 'M12',
    name: 'Facade insulation (ETICS)',
    kategorie: 'gross',
    zielgruppe: OWNER,
    baujahrRelevantBis: 1994,
    investEuro: [15000, 40000],
    einsparEuroJahr: [400, 1200],
    einsparPctHeiz: [20, 40],
    einsparPctStrom: null,
    co2: [800, 2400],
    foerderTyp: 'bafa_huelle',
    foerderMaxEuro: 12000,
    aufwand: 'Specialist, several weeks, scaffolding required',
    beschreibung:
      'External thermal insulation system with 14–20 cm of insulation. The single biggest effect on unrenovated older buildings.',
    houseVoice:
      'My walls are thin, you feel it in winter. Facade insulation would change everything.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'Enter', url: 'https://enter.de/' },
  },
  {
    id: 'M13',
    name: 'Heat pump (air-to-water)',
    kategorie: 'gross',
    zielgruppe: OWNER,
    baujahrRelevantBis: null,
    investEuro: [15000, 30000],
    einsparEuroJahr: [500, 2000],
    einsparPctHeiz: [30, 60],
    einsparPctStrom: null,
    co2: [2000, 5000],
    foerderTyp: 'kfw458',
    foerderMaxEuro: 21000,
    aufwand: 'Specialist, 3–5 days install',
    beschreibung:
      'Replaces the gas/oil heating entirely. COP 3–4, 1 kWh of electricity becomes 3–4 kWh of heat. Especially economical with PV power.',
    houseVoice:
      'My old oil/gas heating is a relic. A heat pump would be my upgrade into the new era.',
    kenergyCta: 'Request a Kenergy heat-pump check',
    briefVorlage: false,
    hinweis:
      'Check first: low-temperature suitability of the radiators (flow ≤ 55 °C is ideal).',
  },
  {
    id: 'M14',
    name: 'Photovoltaic system',
    kategorie: 'gross',
    zielgruppe: OWNER,
    baujahrRelevantBis: null,
    investEuro: [8000, 22000],
    einsparEuroJahr: [600, 1800],
    einsparPctHeiz: null,
    einsparPctStrom: [40, 80],
    co2: [2000, 6000],
    foerderTyp: 'kfw270',
    foerderMaxEuro: null,
    aufwand: 'Specialist (Kenergy partner), 2–3 days',
    beschreibung:
      'PV system on the roof, ideally with a battery. Self-consumption cuts electricity costs massively, surplus is fed into the grid.',
    houseVoice:
      'My roof has potential! With a solar system I could produce my own electricity.',
    kenergyCta: 'Free roof analysis by Kenergy, automatic via satellite data',
    briefVorlage: false,
    hinweis: null,
  },
  {
    id: 'M15',
    name: 'Hydraulic balancing (professional)',
    kategorie: 'mittel',
    zielgruppe: OWNER,
    baujahrRelevantBis: null,
    investEuro: [500, 1500],
    einsparEuroJahr: [100, 300],
    einsparPctHeiz: [5, 15],
    einsparPctStrom: null,
    co2: [200, 600],
    foerderTyp: 'bafa_anlage',
    foerderMaxEuro: 4500,
    aufwand: 'Heating specialist, half a day',
    beschreibung:
      'Optimal setting of all radiator valves so each room gets exactly the right amount of heat. Mandatory with a KfW-funded heating replacement.',
    houseVoice:
      'My heating distributes warmth unevenly. Hydraulic balancing brings every radiator right on point.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'Energie-Effizienz-Experten', url: 'https://www.energie-effizienz-experten.de/' },
  },
  {
    id: 'M16',
    name: 'Ask the landlord to renovate',
    kategorie: 'sofort',
    zielgruppe: TENANT,
    baujahrRelevantBis: 2001,
    investEuro: [0, 0],
    einsparEuroJahr: null,
    einsparPctHeiz: null,
    einsparPctStrom: null,
    co2: [0, 0],
    foerderTyp: null,
    foerderMaxEuro: null,
    aufwand: 'Write a letter (template available)',
    beschreibung:
      'Under §554 BGB tenants can request structural efficiency measures. Alternatively, point the landlord to grants that make a modernization worthwhile for them.',
    houseVoice:
      'My landlord may not even know what’s possible with me. A well-written letter can move a lot.',
    kenergyCta: null,
    briefVorlage: true,
    hinweis: null,
  },
  {
    id: 'M17',
    name: 'Efficient large appliances',
    kategorie: 'mittel',
    zielgruppe: BOTH,
    baujahrRelevantBis: null,
    investEuro: [400, 1500],
    einsparEuroJahr: [50, 200],
    einsparPctHeiz: null,
    einsparPctStrom: [5, 20],
    co2: [50, 200],
    foerderTyp: null,
    foerderMaxEuro: null,
    aufwand: 'Purchase + delivery',
    beschreibung:
      'Replace old appliances (> 10 years) with class-A models. Fridge and freezer have the highest constant power use.',
    houseVoice:
      'My old fridge runs day and night and draws plenty of power. An efficient appliance pays for itself.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'Idealo', url: 'https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=k%C3%BChlschrank' },
  },
  {
    id: 'M18',
    name: 'Ventilate properly (burst airing)',
    kategorie: 'sofort',
    zielgruppe: BOTH,
    baujahrRelevantBis: null,
    investEuro: [0, 0],
    einsparEuroJahr: [50, 150],
    einsparPctHeiz: [3, 7],
    einsparPctStrom: null,
    co2: [100, 300],
    foerderTyp: null,
    foerderMaxEuro: null,
    aufwand: 'Behavior change',
    beschreibung:
      '5–10 min of burst airing 3× a day instead of permanently tilted windows. Tilted windows cool the walls and raise the mold risk.',
    houseVoice:
      'Tilted windows just cool me down. Better a quick burst of airing, then I stay warm and dry.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
  },
  {
    id: 'M19',
    name: 'Ventilation system with heat recovery',
    kategorie: 'mittel',
    zielgruppe: OWNER,
    baujahrRelevantBis: null,
    investEuro: [3000, 8000],
    einsparEuroJahr: [150, 400],
    einsparPctHeiz: [8, 15],
    einsparPctStrom: null,
    co2: [300, 800],
    foerderTyp: 'bafa_huelle',
    foerderMaxEuro: 12000,
    aufwand: 'Specialist, 2–4 days',
    beschreibung:
      'Controlled home ventilation recovers up to 90% of the heat from the exhaust air. Mandatory after an energy retrofit with new windows.',
    houseVoice:
      'Once I’m well insulated, I need fresh air without losing heat. A ventilation system with heat recovery does exactly that.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'Energie-Effizienz-Experten', url: 'https://www.energie-effizienz-experten.de/' },
  },
  {
    id: 'M20',
    name: 'Insulate roller-shutter boxes',
    kategorie: 'klein',
    zielgruppe: BOTH,
    baujahrRelevantBis: 1994,
    investEuro: [20, 100],
    einsparEuroJahr: [30, 80],
    einsparPctHeiz: [1, 4],
    einsparPctStrom: null,
    co2: [60, 160],
    foerderTyp: null,
    foerderMaxEuro: null,
    aufwand: 'DIY, insert insulation mats',
    beschreibung:
      'Old roller-shutter boxes are often uninsulated and let in cold. Insulation inserts from the hardware store (~€5 each) help immediately.',
    houseVoice:
      'My roller-shutter boxes are a thermal bridge. A few insulation mats and the draft is gone.',
    kenergyCta: null,
    briefVorlage: false,
    hinweis: null,
    provider: { name: 'Amazon', url: 'https://www.amazon.de/s?k=rolladenkasten+d%C3%A4mmung' },
  },
]

export const MASSNAHME_BY_ID: Record<string, Massnahme> = Object.fromEntries(
  MASSNAHMEN.map((m) => [m.id, m]),
)
