// Habi – das sprechende Haus-Maskottchen (Duolingo-Style).
// Blinzelt, wippt sanft, raucht aus dem Schornstein; beim Sprechen bewegt
// sich der Mund. Reines Inline-SVG, skaliert über die size-Prop.

type Mood = 'happy' | 'talking' | 'thinking'

interface Props {
  size?: number
  mood?: Mood
  className?: string
}

export function HouseMascot({ size = 40, mood = 'happy', className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={`mascot ${className}`}
      role="img"
      aria-label="Habi, your home"
    >
      {/* Schornstein + Rauch (hinter dem Dach) */}
      <circle className="mascot-smoke1" cx="32.2" cy="7" r="1.4" fill="#cbd5e1" />
      <circle className="mascot-smoke2" cx="33.4" cy="6" r="1.1" fill="#cbd5e1" />
      <rect x="30" y="9" width="4.6" height="7.5" rx="1" fill="#1d4ed8" />

      {/* Körper */}
      <rect x="8" y="20" width="32" height="23" rx="5" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />

      {/* Dach */}
      <path
        d="M4 22 L24 5 L44 22 Z"
        fill="#2563eb"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Wangen */}
      <circle cx="13.5" cy="33.5" r="2.4" fill="#fb7185" opacity="0.45" />
      <circle cx="34.5" cy="33.5" r="2.4" fill="#fb7185" opacity="0.45" />

      {/* Augen (blinzeln) */}
      <g className="mascot-eyes">
        {mood === 'thinking' ? (
          <>
            <circle cx="18" cy="28.5" r="2.3" fill="#1a1a2e" />
            <circle cx="30" cy="28.5" r="2.3" fill="#1a1a2e" />
            <circle cx="18.7" cy="27.6" r="0.8" fill="#fff" />
            <circle cx="30.7" cy="27.6" r="0.8" fill="#fff" />
          </>
        ) : (
          <>
            <ellipse cx="18" cy="29" rx="2.3" ry="2.8" fill="#1a1a2e" />
            <ellipse cx="30" cy="29" rx="2.3" ry="2.8" fill="#1a1a2e" />
            <circle cx="18.8" cy="28" r="0.85" fill="#fff" />
            <circle cx="30.8" cy="28" r="0.85" fill="#fff" />
          </>
        )}
      </g>

      {/* Mund */}
      {mood === 'thinking' ? (
        <circle cx="24" cy="36" r="1.8" fill="none" stroke="#1a1a2e" strokeWidth="2" />
      ) : (
        <path
          className={mood === 'talking' ? 'mascot-mouth-talk' : ''}
          d="M19.5 34.5 Q24 39 28.5 34.5"
          fill="none"
          stroke="#1a1a2e"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}
