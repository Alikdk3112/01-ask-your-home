import { useState } from 'react'
import {
  BadgeEuro,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Info,
  Leaf,
  PiggyBank,
  ShieldCheck,
  Sun,
  Wrench,
  X,
} from 'lucide-react'
import type { EnergyPlan, PlanMeasure, UserProfile } from '../lib/types'
import { PROFILE_INTRO } from '../lib/profile'
import { generateVermieterBrief } from '../lib/brief'
import { exportPlanPdf } from '../lib/pdf'
import { PrivacyNotice } from './PrivacyNotice'

const KAT_STYLE: Record<PlanMeasure['kategorie'], { label: string; cls: string }> = {
  sofort: { label: 'Now', cls: 'bg-success-100 text-success' },
  klein: { label: 'Small', cls: 'bg-brand-100 text-brand-600' },
  mittel: { label: 'Medium', cls: 'bg-amber-100 text-amber-700' },
  gross: { label: 'Large', cls: 'bg-indigo-100 text-indigo-700' },
}

function euro(n: number): string {
  return n.toLocaleString('en-US')
}

function MeasureCard({ m, rank }: { m: PlanMeasure; rank: number }) {
  const [open, setOpen] = useState(false)
  const kat = KAT_STYLE[m.kategorie]
  const hasSavings = m.savedEuroMax > 0
  const hasEigenanteil = m.foerderEuro > 0 && m.investMax > 0
  return (
    <div className="ks-card animate-rise p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="block w-full text-left"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
            {rank}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-ink">{m.name}</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${kat.cls}`}>
                {kat.label}
              </span>
            </div>
            <p className="mt-1 text-sm italic leading-snug text-ink-soft">“{m.houseVoice}”</p>
          </div>
          <ChevronDown
            className={`mt-1 h-5 w-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            strokeWidth={2}
          />
        </div>
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-success">
          <PiggyBank className="h-4 w-4" strokeWidth={2} />
          {hasSavings ? `€${euro(m.savedEuroMin)}–${euro(m.savedEuroMax)}/year` : 'Value depends on implementation'}
        </span>
        {m.investMax > 0 && (
          <span className="text-muted">
            Invest €{euro(m.investMin)}–{euro(m.investMax)}
          </span>
        )}
      </div>

      {m.foerderEuro > 0 && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-success-50 px-2.5 py-1 text-sm text-success">
          <BadgeEuro className="h-4 w-4" strokeWidth={2} />
          €{euro(m.foerderEuro)} grant
          {m.foerderProgramm ? ` · ${m.foerderProgramm}` : ''}
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 text-sm font-medium text-brand-600 hover:underline"
        >
          More details
        </button>
      )}

      {open && (
        <div className="mt-2 space-y-2 animate-rise">
          <p className="text-sm leading-relaxed text-ink-soft">{m.beschreibung}</p>

          <div className="flex items-start gap-1.5 text-xs text-muted">
            <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span>Effort: {m.aufwand}</span>
          </div>

          {hasEigenanteil && (
            <div className="flex items-start gap-1.5 text-xs text-ink-soft">
              <BadgeEuro className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2} />
              <span>
                Your cost after grant: €{euro(m.eigenanteilMin)}–{euro(m.eigenanteilMax)}
              </span>
            </div>
          )}

          {m.co2Max > 0 && (
            <div className="flex items-start gap-1.5 text-xs text-ink-soft">
              <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2} />
              <span>
                saves {euro(m.co2Min)}–{euro(m.co2Max)} kg CO₂ per year
              </span>
            </div>
          )}

          {(m.hinweis || m.foerderHinweis) && (
            <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span>{[m.hinweis, m.foerderHinweis].filter(Boolean).join(' ')}</span>
            </div>
          )}
        </div>
      )}

      {m.kenergyCta && (
        <a
          href="https://kenergy-solutions.de"
          target="_blank"
          rel="noreferrer"
          className="ks-btn mt-3 w-full bg-brand-600 text-sm"
        >
          <Sun className="h-4 w-4" strokeWidth={2} />
          {m.kenergyCta}
        </a>
      )}

      {!m.kenergyCta && m.provider && (
        <a
          href={m.provider.url}
          target="_blank"
          rel="noreferrer"
          className="ks-btn-ghost mt-3 w-full text-sm"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={2} />
          Go to {m.provider.name}
        </a>
      )}
    </div>
  )
}

interface Props {
  plan: EnergyPlan
  profile: UserProfile
}

export function PlanView({ plan, profile }: Props) {
  const [briefOpen, setBriefOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const briefText = generateVermieterBrief(profile, plan)

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(briefText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* Clipboard nicht verfügbar, Nutzer kann den Text manuell markieren. */
    }
  }

  return (
    <div className="animate-rise space-y-3">
      <div className="ks-card p-5">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-600">
          Profile: {plan.profilLabel}
        </div>
        <p className="leading-relaxed text-ink">{PROFILE_INTRO[plan.profilTyp]}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-success-50 p-3">
            <div className="text-lg font-bold text-success">
              €{euro(plan.estimatedSavingsMin)}–{euro(plan.estimatedSavingsMax)}
            </div>
            <div className="text-xs text-muted">savings/year</div>
          </div>
          <div className="rounded-xl bg-brand-50 p-3">
            <div className="text-lg font-bold text-brand-600">€{euro(plan.totalFoerder)}</div>
            <div className="text-xs text-muted">possible grants</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3">
            <div className="inline-flex items-center gap-1 text-lg font-bold text-emerald-700">
              <Leaf className="h-4 w-4" strokeWidth={2} />
              {euro(plan.co2SavingsKg)}
            </div>
            <div className="text-xs text-muted">kg CO₂/year</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {plan.measures.map((m, i) => (
          <MeasureCard key={m.id} m={m} rank={i + 1} />
        ))}
      </div>

      {plan.vermieterBrief && (
        <button
          type="button"
          onClick={() => setBriefOpen(true)}
          className="ks-btn w-full"
        >
          <FileText className="h-5 w-5" strokeWidth={2} />
          Create a letter to my landlord
        </button>
      )}

      <button
        type="button"
        onClick={() => exportPlanPdf(plan, profile)}
        className="ks-btn-ghost w-full"
      >
        <Download className="h-5 w-5" strokeWidth={2} />
        Save plan as PDF
      </button>

      {/* Quellen & Methodik (aufklappbar) */}
      <div className="ks-card overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setSourcesOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-ink-soft"
          aria-expanded={sourcesOpen}
        >
          Sources &amp; methodology
          <ChevronDown
            className={`h-4 w-4 text-muted transition-transform ${sourcesOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {sourcesOpen && (
          <div className="space-y-2 border-t border-line px-4 py-3 text-xs leading-relaxed text-muted [overflow-wrap:anywhere]">
            <p>
              <span className="font-medium text-ink-soft">Energy demand:</span> European building
              typology TABULA/EPISCOPE (actual and target consumption per building type and age).
            </p>
            <p>
              <span className="font-medium text-ink-soft">Energy prices:</span> Heizspiegel 2025 for
              gas, oil, district heating and electricity.
            </p>
            <p>
              <span className="font-medium text-ink-soft">Grants:</span> BAFA BEG individual measures
              2026, KfW 458 (heating replacement) and KfW 270 (PV loan). Amounts are guidelines; the
              actual figure depends on income, iSFP and your municipality.
            </p>
            <p>
              <span className="font-medium text-ink-soft">Regional data:</span> Building statistics
              from ETHOS, derived from the postal code.
            </p>
            <p className="pt-1">
              All figures are guidelines and do not replace binding professional energy advice.
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setPrivacyOpen(true)}
        className="mx-auto flex items-center gap-1.5 px-1 text-center text-xs text-muted hover:text-ink-soft"
      >
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
        Privacy: no accounts, no tracking
      </button>

      {privacyOpen && <PrivacyNotice onClose={() => setPrivacyOpen(false)} />}

      {briefOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setBriefOpen(false)}
        >
          <div
            className="ks-card max-h-[85vh] w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line p-4">
              <h3 className="font-semibold text-ink">Letter template for your landlord</h3>
              <button
                type="button"
                onClick={() => setBriefOpen(false)}
                className="text-muted hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              readOnly
              className="scrollbar-slim h-72 w-full resize-none border-0 p-4 font-mono text-sm text-ink-soft outline-none"
              value={briefText}
            />
            <div className="border-t border-line p-3">
              <button type="button" onClick={copyBrief} className="ks-btn w-full">
                {copied ? (
                  <>
                    <Check className="h-5 w-5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" /> Copy text
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
