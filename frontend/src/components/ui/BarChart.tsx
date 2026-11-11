import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface Bar {
  key: string
  value: number
  tick?: string            // x-axis label (only some bars get one)
  tooltip: ReactNode
  tone?: 'normal' | 'muted' | 'current'
  marker?: string          // small label at the end of the bar, e.g. "laagst"
}

/**
 * Single-series bar chart in plain HTML: one colour, 2px gaps, rounded data ends
 * on the baseline, a recessive grid, and a tooltip on hover / tap.
 * Negative values (e.g. negative power prices) grow down from the zero line.
 */
export function BarChart({ bars, color, height = 160, yFormat, gridLines = 3, compact }: {
  bars: Bar[]
  color: string
  height?: number
  yFormat?: (v: number) => string
  gridLines?: number
  compact?: boolean        // no axes/ticks (for small tiles)
}) {
  const [hover, setHover] = useState<number | null>(null)
  // Finger: press and slide over the bars to read them (the tooltip stays a moment after lifting)
  const barsRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | undefined>(undefined)
  const indexAt = (x: number) => {
    const r = barsRef.current?.getBoundingClientRect()
    if (!r || r.width === 0) return null
    return Math.max(0, Math.min(bars.length - 1, Math.floor(((x - r.left) / r.width) * bars.length)))
  }
  const point = (e: React.PointerEvent) => { window.clearTimeout(hideTimer.current); setHover(indexAt(e.clientX)) }
  if (bars.length === 0) return <div style={{ height }} />

  const max = Math.max(0, ...bars.map(b => b.value))
  const min = Math.min(0, ...bars.map(b => b.value))
  const range = max - min || 1
  const zero = (max / range) * 100 // % from top
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => max - (range * i) / gridLines)
  const active = hover != null ? bars[hover] : null

  return (
    <div className="relative select-none" onPointerLeave={e => { if (e.pointerType === 'mouse') setHover(null) }}>
      {/* Tooltip */}
      {active && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-subtle2 bg-[var(--c-solid)] px-2.5 py-1.5 text-xs text-fg shadow-lg"
          style={{ left: `clamp(48px, ${((hover! + 0.5) / bars.length) * 100}%, calc(100% - 48px))` }}
        >
          {active.tooltip}
        </div>
      )}

      <div className="flex gap-2">
        {/* Y axis labels */}
        {!compact && yFormat && (
          <div className="relative w-10 shrink-0 text-right text-[10px] text-fg3 tabular" style={{ height }}>
            {ticks.map((t, i) => (
              <span key={i} className="absolute right-0 -translate-y-1/2" style={{ top: `${(i / gridLines) * 100}%` }}>{yFormat(t)}</span>
            ))}
          </div>
        )}

        <div className="relative min-w-0 flex-1" style={{ height }}>
          {/* Grid */}
          {!compact && ticks.map((_, i) => (
            <div key={i} className="absolute inset-x-0 border-t border-dashed border-subtle" style={{ top: `${(i / gridLines) * 100}%` }} />
          ))}
          {min < 0 && <div className="absolute inset-x-0 border-t border-subtle2" style={{ top: `${zero}%` }} />}

          {/* Bars */}
          <div ref={barsRef} className="absolute inset-0 flex gap-[2px]" style={{ touchAction: 'pan-y' }}
            onPointerDown={point} onPointerMove={point}
            onPointerUp={e => { if (e.pointerType !== 'mouse') hideTimer.current = window.setTimeout(() => setHover(null), 2500) }}
            onPointerCancel={() => setHover(null)}>
            {bars.map((b, i) => {
              const h = (Math.abs(b.value) / range) * 100
              const neg = b.value < 0
              const opacity = b.tone === 'muted' ? 0.35 : hover != null && hover !== i ? 0.6 : 1
              return (
                <div
                  key={b.key}
                  className="relative h-full min-w-0 flex-1 cursor-pointer"
                >
                  <div
                    className={cn('absolute inset-x-0 transition-[height,opacity] duration-500', neg ? 'rounded-b-[4px]' : 'rounded-t-[4px]')}
                    style={{
                      background: color,
                      opacity,
                      height: `${Math.max(h, b.value === 0 ? 0 : 1.5)}%`,
                      ...(neg ? { top: `${zero}%` } : { bottom: `${100 - zero}%` }),
                      boxShadow: b.tone === 'current' ? `0 0 0 2px var(--c-fg), 0 0 14px ${color}` : undefined,
                    }}
                  />
                  {b.marker && !compact && (
                    <span
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--c-solid)] px-1 text-[10px] font-semibold text-fg"
                      style={neg
                        ? { top: `calc(${zero + Math.max(h, 1.5)}% + 4px)` }
                        : { bottom: `calc(${100 - zero + Math.max(h, 1.5)}% + 4px)` }}
                    >
                      {b.marker}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* X ticks */}
      {!compact && (
        <div className={cn('mt-1.5 flex gap-[2px] text-[10px] text-fg3 tabular', yFormat && 'pl-12')}>
          {bars.map(b => (
            <span key={b.key} className="relative min-w-0 flex-1">
              {b.tick && <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{b.tick}</span>}
            </span>
          ))}
        </div>
      )}
      {!compact && <div className="h-3" />}
    </div>
  )
}
