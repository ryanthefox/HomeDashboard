import { useRef } from 'react'
import { motion } from 'motion/react'
import { CalendarDays } from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { dayKey } from '@/lib/afval'
import { useCalendar, visibleEvents, eventsByDay, upcoming, timeRange, dayTitle, calendarColor, CALENDAR_VISIBLE_KEY } from '@/lib/calendar'
import { EmptyState, Skeleton } from '@/components/ui/motion'
import { useContainerSize, TileHeader } from './shared'

const ROW_H = 42, HEAD_H = 22

export function MiniCalendar() {
  const ref = useRef<HTMLDivElement>(null)
  const { h, w } = useContainerSize(ref)
  const { data, isLoading } = useCalendar()
  const [selected] = useLocalStorage<string[]>(CALENDAR_VISIBLE_KEY, [])
  const today = dayKey(new Date())

  // Upcoming days, as many rows as fit (header 40px)
  const days = [...eventsByDay(upcoming(visibleEvents(data, selected), 30)).entries()]
    .filter(([k]) => k >= today).sort(([a], [b]) => a.localeCompare(b))
  let budget = Math.max(0, h - 40)
  const shown: { key: string; list: typeof days[number][1] }[] = []
  for (const [key, list] of days) {
    if (budget < HEAD_H + ROW_H) break
    const fit = Math.min(list.length, Math.floor((budget - HEAD_H) / ROW_H))
    shown.push({ key, list: list.slice(0, fit) })
    budget -= HEAD_H + fit * ROW_H + 6
  }

  return (
    <div ref={ref} className="flex h-full flex-col overflow-hidden p-4">
      <TileHeader icon={<CalendarDays />} title="Agenda"
        right={w >= 250 && <span className="text-[11px] capitalize text-fg3">{new Date().toLocaleDateString('nl-NL', w < 380 ? { weekday: 'short', day: 'numeric', month: 'short' } : { weekday: 'long', day: 'numeric', month: 'long' })}</span>} />
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-9" />)}</div>
      ) : !data?.configured ? (
        <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="Geen agenda gekoppeld" hint="Zie CALENDAR_ICS_URLS in .env" compact={h < 200} />
      ) : shown.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="Niets gepland" />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
          {shown.map(({ key, list }, gi) => (
            <div key={key} className="flex flex-col gap-1">
              <p className="h-4 text-[11px] font-medium uppercase tracking-wider text-fg3">{dayTitle(key).title}</p>
              {list.map((ev, i) => {
                const color = calendarColor(ev.calendar)
                return (
                  <motion.div key={ev.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (gi * 3 + i) * 0.04 }}
                    className="flex h-9 items-center gap-2.5 rounded-xl bg-card3 px-2.5">
                    <span className="h-5 w-1 shrink-0 rounded-full" style={{ background: color }} />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-fg">{ev.title}</span>
                    <span className="shrink-0 text-[11px] text-fg3 tabular">{timeRange(ev, key)}</span>
                  </motion.div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
