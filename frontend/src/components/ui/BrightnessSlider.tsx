import { useState } from 'react'
import { Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Brightness slider with a glowing fill. While the user drags, it shows its own
 * local value so stale server pushes can't make the thumb jump back.
 */
export function BrightnessSlider({
  value, accent, onChange, className, compact,
}: {
  value: number
  accent: string
  onChange: (v: number) => void
  className?: string
  compact?: boolean
}) {
  const [drag, setDrag] = useState<number | null>(null)
  const shown = drag ?? value

  return (
    <div className={cn('flex items-center gap-2.5', className)} onClick={e => e.stopPropagation()}>
      <Sun className={cn('shrink-0 text-fg3', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <div className={cn('group relative flex-1 rounded-full bg-[var(--c-track)]', compact ? 'h-1.5' : 'h-2')}>
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${shown}%`,
            background: `linear-gradient(90deg, ${accent}99, ${accent})`,
            boxShadow: `0 0 12px -1px ${accent}aa`,
            transition: drag == null ? 'width .45s cubic-bezier(.16,1,.3,1)' : 'none',
          }}
        />
        <div
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-transform duration-200 group-hover:scale-110',
            compact ? 'h-3 w-3' : 'h-4 w-4',
            drag != null && 'scale-125',
          )}
          style={{
            left: `${Math.min(Math.max(shown, 4), 96)}%`,
            boxShadow: `0 0 0 3px ${accent}33, 0 2px 6px rgba(0,0,0,.35)`,
            transition: drag == null ? 'left .45s cubic-bezier(.16,1,.3,1), transform .2s' : 'transform .2s',
          }}
        />
        <input
          type="range" min={1} max={100} value={shown}
          aria-label="Helderheid"
          onPointerDown={() => setDrag(value)}
          onPointerUp={() => setDrag(null)}
          onPointerCancel={() => setDrag(null)}
          onBlur={() => setDrag(null)}
          onChange={e => {
            const v = Number(e.target.value)
            if (drag != null) setDrag(v)
            onChange(v)
          }}
          className="absolute -inset-y-2 inset-x-0 h-[calc(100%+16px)] w-full cursor-pointer opacity-0"
        />
      </div>
      <span className={cn('w-9 text-right font-medium tabular text-fg2', compact ? 'text-[11px]' : 'text-xs')}>{shown}%</span>
    </div>
  )
}
