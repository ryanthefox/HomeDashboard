import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Trash2, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { afvalApi, type AfvalItem } from '@/lib/api'
import { afvalColor, afvalDateLabel } from '@/lib/afval'
import { Panel, Label, EmptyState, Skeleton } from '@/components/ui/motion'

export function AfvalWidget() {
  const { data: items = [], isLoading } = useQuery<AfvalItem[]>({
    queryKey: ['afval', 'upcoming'], queryFn: afvalApi.getUpcoming,
    refetchInterval: 60 * 60_000, staleTime: 60 * 60_000,
  })

  const next = items[0]
  const nextInfo = next ? afvalDateLabel(next.date) : null
  const nextColor = next ? afvalColor(next.type) : '#fb923c'

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-4">
        {isLoading ? (
          <><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-72 rounded-3xl" /></>
        ) : items.length === 0 ? (
          <Panel className="flex p-8">
            <EmptyState icon={<Trash2 className="h-5 w-5" />} title="Geen ophaaldata gevonden" hint="Stel Afval:ICalUrl in appsettings.json in" />
          </Panel>
        ) : (
          <>
            {/* Hero: next collection */}
            {next && nextInfo && (
              <Panel className="relative overflow-hidden p-6">
                <motion.div className="pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full blur-3xl"
                  animate={{ opacity: [0.25, 0.4, 0.25] }} transition={{ duration: 5, repeat: Infinity }}
                  style={{ background: nextColor }} />
                <div className="relative flex items-center gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: `${nextColor}22`, boxShadow: `inset 0 0 0 1px ${nextColor}55, 0 0 30px -6px ${nextColor}` }}>
                    <Trash2 className="h-7 w-7" style={{ color: nextColor }} />
                  </div>
                  <div className="min-w-0">
                    <p className="label-caps">Volgende ophaling</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-fg">{next.label}</p>
                    <p className="text-sm font-medium" style={{ color: nextColor }}>
                      {nextInfo.label}{nextInfo.days > 2 && ` · over ${nextInfo.days} dagen`}
                    </p>
                  </div>
                </div>
              </Panel>
            )}

            <Panel index={1} className="p-5">
              <Label icon={<CalendarDays />} className="mb-4">Komende weken</Label>
              <div className="relative space-y-1.5">
                {/* timeline rail */}
                <div className="absolute bottom-3 left-[13px] top-3 w-px bg-[var(--c-border2)]" />
                {items.map((item, idx) => {
                  const { label, urgent } = afvalDateLabel(item.date)
                  const color = afvalColor(item.type)
                  return (
                    <motion.div
                      key={`${item.type}-${item.date}-${idx}`}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + Math.min(idx, 12) * 0.035, duration: 0.4 }}
                      className={cn('relative flex items-center gap-3 rounded-2xl py-2.5 pl-1.5 pr-3 transition-colors', urgent ? '' : 'hover:bg-card3')}
                      style={urgent ? { background: `${color}18` } : undefined}
                    >
                      <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--c-solid)]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
                      </span>
                      <p className={cn('flex-1 text-sm', urgent ? 'font-semibold text-fg' : 'font-medium text-fg')}>{item.label}</p>
                      <span className={cn('shrink-0 text-xs tabular', urgent ? 'font-semibold' : 'text-fg3')} style={urgent ? { color } : undefined}>
                        {label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}
