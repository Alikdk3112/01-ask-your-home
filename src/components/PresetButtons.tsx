import type { PresetOption } from '../lib/flow'

interface Props {
  options: PresetOption[]
  grid?: boolean
  onPick: (option: PresetOption) => void
}

export function PresetButtons({ options, grid, onPick }: Props) {
  return (
    <div className={grid ? 'grid grid-cols-2 gap-2.5' : 'flex flex-col gap-2.5'}>
      {options.map((o) => {
        const Icon = o.icon
        return (
          <button
            key={String(o.value)}
            type="button"
            className={grid ? 'ks-pill flex-col items-start gap-2 py-4' : 'ks-pill'}
            onClick={() => onPick(o)}
          >
            {Icon && <Icon className="h-5 w-5 shrink-0 text-brand-600" strokeWidth={1.8} />}
            <span className="leading-tight">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
