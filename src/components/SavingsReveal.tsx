import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Sparkles, TrendingDown } from 'lucide-react'
import type { EnergyPlan, Ownership } from '../lib/types'
import { CountUp } from './CountUp'

interface Props {
  plan: EnergyPlan
  ortLabel: string
  ownership: Ownership | null
}

export function SavingsReveal({ plan, ortLabel, ownership }: Props) {
  const mid = Math.round((plan.estimatedSavingsMin + plan.estimatedSavingsMax) / 2)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 70,
        startVelocity: 38,
        origin: { y: 0.7 },
        colors: ['#2563eb', '#22c55e', '#60a5fa', '#ffffff'],
      })
    }, 1300)
    return () => clearTimeout(t)
  }, [])
  const selbst =
    ownership === 'mieter'
      ? 'As a tenant you can tackle a good part of this yourself.'
      : 'As an owner every lever is open to you.'

  return (
    <div className="ks-card animate-rise overflow-hidden">
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted">
          <Sparkles className="h-4 w-4 text-brand-600" strokeWidth={2} />
          I had a look around …
        </div>
        <p className="leading-relaxed text-ink-soft">
          I’m a <span className="font-semibold text-ink">{plan.archetypLabel}</span> in{' '}
          <span className="font-semibold text-ink">{ortLabel}</span>. Houses like me use about{' '}
          <span className="font-semibold text-ink">{plan.demandIst} kWh/m²</span> a year, roughly{' '}
          <span className="font-semibold text-warn">{plan.pctOverStandard}% more</span> than would be
          needed today.
        </p>
      </div>

      <div className="border-t border-line bg-success-50 px-5 py-6 text-center">
        <div className="mb-1 text-sm font-medium text-success">Your estimated savings potential</div>
        <div className="flex items-center justify-center gap-2 text-success">
          <TrendingDown className="h-7 w-7" strokeWidth={2.2} />
          <span className="text-5xl font-bold tracking-tight">
            <CountUp to={mid} prefix="~€" />
          </span>
        </div>
        <div className="mt-1 text-sm text-success/80">
          per year · range €{plan.estimatedSavingsMin}–{plan.estimatedSavingsMax}
        </div>
      </div>

      <div className="p-5">
        <p className="text-ink-soft">{selbst} Want me to show you how?</p>
      </div>
    </div>
  )
}
