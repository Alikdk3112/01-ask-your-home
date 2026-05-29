import { useEffect, useRef, useState } from 'react'

interface Props {
  to: number
  duration?: number
  prefix?: string
  suffix?: string
}

// Counts up from 0 to the target value (wow moment).
export function CountUp({ to, duration = 1600, prefix = '', suffix = '' }: Props) {
  const [val, setVal] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    let raf = 0
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const p = Math.min((t - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])

  return (
    <span>
      {prefix}
      {val.toLocaleString('en-US')}
      {suffix}
    </span>
  )
}
