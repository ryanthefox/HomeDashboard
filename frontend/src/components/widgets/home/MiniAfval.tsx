import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { afvalApi, type AfvalItem } from '@/lib/api'
import { afvalColor, afvalDateLabel } from '@/lib/afval'
import { EmptyState, Skeleton } from '@/components/ui/motion'
import { useContainerSize, TileHeader } from './shared'

export function MiniAfval() {
  const ref = useRef<HTMLDivElement>(null)
  const { h } = useContainerSize(ref)
  const { data: items = [], isLoading } = useQuery<AfvalItem[]>({
    queryKey: ['afval', 'upcoming'], queryFn: afvalApi.getUpcoming,
    refetchInterval: 60 * 60_000, staleTime: 60 * 60_000,
  })

  // Show as many rows as fit (header ≈ 48px, row ≈ 40px)
  const rows  = Math.max(1, Math.floor((h - 56) / 40))
  const shown = items.slice(0, Math.min(rows, 8))
  const next  = items[0]
  const nextLabel = next ? afvalDateLabel(next.date) : null

  return (
    <div ref={ref} className="relative flex h-full flex-col overflow-hidden p-4">
      {/* Glow tinted with the next collection's colour when it's soon */}
      {next && nextLabel?.urgent && (
        <motion.div className="pointer-events-none absolute -left-1/4 -top-1/2 h-full w-2/3 rounded-full blur-3xl"
          initial={{ opacity: 0 }} animate={{ opacity: [0.12, 0.22, 0.12] }} transition={{ duration: 4, repeat: Infinity }}
          style={{ background: afvalColor(next.type) }} />
      )}
      <TileHeader icon={<Trash2 />} title="Afval" />

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-7" />)}</div>
      ) : shown.length === 0 ? (
        <EmptyState icon={<Trash2 className="h-5 w-5" />} title="Geen ophaaldata" />
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
          {shown.map((item, i) => {
            const { label, urgent } = afvalDateLabel(item.date)
            const color = afvalColor(item.type)
            return (
              <motion.div key={`${item.type}-${item.date}`}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}
                className={cn('flex items-center gap-2.5 rounded-xl px-2.5 py-2', urgent ? '' : 'bg-card3')}
                style={urgent ? { background: `${color}1f`, boxShadow: `inset 0 0 0 1px ${color}40` } : undefined}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
                <span className={cn('flex-1 truncate text-xs', urgent ? 'font-semibold text-fg' : 'text-fg2')}>{item.label}</span>
                <span className={cn('shrink-0 text-[11px] tabular', urgent ? 'font-semibold' : 'text-fg3')} style={urgent ? { color } : undefined}>
                  {label}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
