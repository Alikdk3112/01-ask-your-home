import { STEPS, type PresetOption, type StepId } from './flow'
import { callHouse, type ChatMessage } from './api'
import type { UserProfile } from './types'

// Dynamische Phase-2-Befragung: WELCHE Felder gefragt werden, bleibt
// deterministisch (buildContextSequence in flow.ts). WIE gefragt wird –
// Wortlaut der Hausfrage und der Antwort-Buttons – generiert das LLM live.
// Die Antwort-WERTE bleiben strikt auf die erlaubten Enum-Werte beschränkt,
// damit die Profil-Erfassung und die deterministische Planberechnung exakt
// gleich funktionieren. Fällt das LLM aus (kein Key/Fehler), greifen die
// statischen Fragen aus STEPS – die App bleibt demo-sicher.

export interface InterviewQuestion {
  message: string
  options: PresetOption[]
}

// Kurzbeschreibung je Feld, damit das Haus eine natürliche Frage formulieren kann.
const FIELD_BRIEF: Record<StepId, string> = {
  motivation: 'what the resident cares about most right now',
  ownership: 'whether the resident rents or owns me',
  buildingType: 'what kind of building I am',
  constructionPeriod: 'roughly when I was built',
  livingArea: 'how big I am, in square metres',
  plz: 'which area I am in (postal code)',
  heating: 'how I am heated',
  landlordRelation: 'how reachable the landlord is',
  insulation: 'whether I am insulated',
  budget: 'how much the resident is willing to invest',
  monthlyCost: 'what the resident pays per month for heat and electricity',
  existingMeasures: 'whether they have already done any energy upgrades at all (like LEDs, smart thermostats or new windows) — phrase it as a yes/no-ish question, not as a request to list them',
  priority: 'what outcome matters most to the resident',
}

const INTERVIEW_SYSTEM = `You are the user's home itself, speaking in the first person ("I", "my walls", "we"). You are warm, friendly, a little playful, and you never use technical jargon. You are gently interviewing the person who lives in you to build a personalized energy-savings plan.

Produce the NEXT question only. Respond with ONLY a JSON object, no markdown fences, no extra text, in exactly this shape:
{"message": "<your first-person question, ONE short sentence>", "options": [{"value": "<allowed value>", "label": "<short button label>"}]}

Rules:
- Write in English.
- Use ONLY the answer values you are given; never invent new values.
- Include every given value exactly once.
- Keep each label short (under ~28 characters) and natural.
- Ask just the question. Do NOT open with praise or compliments, and do NOT restate the resident's motivation or priorities (no "It's great that you care about…", no "I see you want…"). Get straight to the point.
- Vary your wording. Never reuse an opening phrase or sentence structure you have used in an earlier question.
- Never repeat a question that is already answered.`

function fallbackQuestion(id: StepId): InterviewQuestion {
  const s = STEPS[id]
  return { message: s.message, options: s.options ?? [] }
}

// Bekanntes Profil für den LLM-Kontext lesbar zusammenfassen (über die
// statischen Option-Labels, damit Enum-Werte als Klartext erscheinen).
function describeKnown(p: UserProfile): string {
  const lines: string[] = []
  const add = (id: StepId, raw: unknown) => {
    if (raw === null || raw === undefined || raw === '') return
    const opt = STEPS[id].options?.find((o) => String(o.value) === String(raw))
    lines.push(`- ${FIELD_BRIEF[id]}: ${opt?.label ?? String(raw)}`)
  }
  add('motivation', p.motivation)
  add('ownership', p.ownership)
  add('buildingType', p.buildingType)
  add('constructionPeriod', p.constructionPeriod)
  add('livingArea', p.livingArea)
  add('heating', p.heating)
  add('monthlyCost', p.monthlyCost)
  add('existingMeasures', p.existingMeasures)
  add('priority', p.priority)
  if (p.ort) lines.push(`- where I stand: ${`${p.plz ?? ''} ${p.ort}`.trim()}`)
  return lines.join('\n')
}

function extractJson(raw: string): string | null {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  return raw.slice(start, end + 1)
}

// LLM-Antwort gegen die erlaubten Optionen validieren. Werte stammen IMMER aus
// dem Enum (STEPS); nur die Labels dürfen vom LLM kommen. Reihenfolge und
// Vollständigkeit der Optionen werden erzwungen.
function parse(raw: string, allowed: PresetOption[]): InterviewQuestion | null {
  const json = extractJson(raw)
  if (!json) return null
  let obj: { message?: unknown; options?: unknown }
  try {
    obj = JSON.parse(json)
  } catch {
    return null
  }
  if (typeof obj.message !== 'string' || !Array.isArray(obj.options)) return null
  const message = obj.message.trim()
  if (!message) return null

  const allowedKeys = new Set(allowed.map((o) => String(o.value)))
  const labelByValue = new Map<string, string>()
  for (const o of obj.options as Array<{ value?: unknown; label?: unknown }>) {
    const key = String(o?.value)
    if (!allowedKeys.has(key)) continue
    if (typeof o?.label === 'string' && o.label.trim()) {
      labelByValue.set(key, o.label.trim().slice(0, 40))
    }
  }
  // Immer alle erlaubten Optionen, in fester Reihenfolge; Icon/Sub aus STEPS behalten.
  const options = allowed.map((o) => ({
    ...o,
    label: labelByValue.get(String(o.value)) ?? o.label,
  }))
  return { message, options }
}

/**
 * Erzeugt die nächste Frage (Wortlaut + Button-Labels) dynamisch via LLM.
 * Bei fehlendem Key, Netzwerkfehler oder ungültiger Antwort: statische Frage.
 */
export async function generateQuestion(
  profile: UserProfile,
  id: StepId,
  asked: string[] = [],
): Promise<InterviewQuestion> {
  const staticStep = STEPS[id]
  if (!staticStep.options || staticStep.options.length === 0) return fallbackQuestion(id)

  const allowedList = staticStep.options.map((o) => `- ${o.value}: ${o.label}`).join('\n')
  const known = describeKnown(profile)
  const askedBlock = asked.length
    ? `\nQuestions I have already asked (do NOT reuse their wording or opening):\n${asked.map((q) => `- ${q}`).join('\n')}\n`
    : ''
  const messages: ChatMessage[] = [
    { role: 'system', content: INTERVIEW_SYSTEM },
    {
      role: 'user',
      content: `What I already know about myself and the person living in me:
${known || '(nothing yet)'}
${askedBlock}
Now ask about: ${FIELD_BRIEF[id]}.
Use ONLY these answer values (value: meaning):
${allowedList}

Return the JSON now.`,
    },
  ]

  const res = await callHouse(messages, { temperature: 0.6, maxTokens: 300 })
  if (!res.content) return fallbackQuestion(id)
  return parse(res.content, staticStep.options) ?? fallbackQuestion(id)
}
