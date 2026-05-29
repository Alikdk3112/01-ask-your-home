import { HouseMascot } from './HouseMascot'

// Drei animierte Punkte, während das Haus "tippt".
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade">
      <HouseMascot size={38} mood="thinking" className="shrink-0" />
      <div className="bubble inline-flex items-center gap-1.5 py-3">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  )
}
