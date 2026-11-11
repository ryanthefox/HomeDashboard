import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { Trash2, CalendarDays, ChevronLeft, ChevronRight, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { afvalApi, type AfvalItem } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  afvalColor, afvalDateLabel, dayKey, monthGrid, monthIndex, NL_MONTHS_LONG, NL_WEEKDAYS_MON,
} from '@/lib/afval'
import { Panel, Label, EmptyState, Skeleton, Segmented, Press } from '@/components/ui/motion'

type View = 'lijst' | 'kalender'

// ── Hero: next collection ─────────────────────────────────────────────────────
function NextCollection({ next }: { next: AfvalItem }) {
  const info  = afvalDateLabel(next.date)
  const color = afvalColor(next.type)
  return (
    <Panel className="relative overflow-hidden p-5 sm:p-6">
      <motion.div className="pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full blur-3xl"
        animate={{ opacity: [0.25, 0.4, 0.25] }} transition={{ duration: 5, repeat: Infinity }}
        style={{ background: color }} />
      <div className="relative flex items-center gap-4 sm:gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16"
          style={{ background: `${color}22`, boxShadow: `inset 0 0 0 1px ${color}55, 0 0 30px -6px ${color}` }}>
          <Trash2 className="h-7 w-7" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="label-caps">Volgende ophaling</p>
          <p className="mt-1 truncate text-xl font-semibold tracking-tight text-fg sm:text-2xl">{next.label}</p>
          <p className="text-sm font-medium" style={{ color }}>
            {info.label}{info.days > 2 && ` · over ${info.days} dagen`}
          </p>
        </div>
      </div>
    </Panel>
  )
}

// ── List view ─────────────────────────────────────────────────────────────────
function ListView({ items }: { items: AfvalItem[] }) {
  return (
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
  )
}

// ── Calendar (month) view ─────────────────────────────────────────────────────
function CalendarView({ items }: { items: AfvalItem[] }) {
  const today = new Date()
  const todayKey = dayKey(today)
  const [cursor, setCursor] = useState(() => monthIndex(today))
  const [dir, setDir] = useState(0)
  const [selected, setSelected] = useState<string>(todayKey)

  const byDay = useMemo(() => {
    const m = new Map<string, AfvalItem[]>()
    for (const it of items) {
      const k = dayKey(it.date)
      m.set(k, [...(m.get(k) ?? []), it])
    }
    return m
  }, [items])

  // Only allow browsing months the calendar has data for (but always the current one)
  const dates = items.map(i => new Date(i.date))
  const minMonth = Math.min(monthIndex(today), ...dates.map(monthIndex))
  const maxMonth = Math.max(monthIndex(today), ...dates.map(monthIndex))

  const year  = Math.floor(cursor / 12)
  const month = cursor % 12
  const days  = monthGrid(year, month)
  const go = (d: -1 | 1) => {
    const next = cursor + d
    if (next < minMonth || next > maxMonth) return
    setDir(d); setCursor(next)
  }

  // Types collected this month, for the legend
  const monthTypes = new Map<string, string>()
  for (const d of days) {
    if (d.getMonth() !== month) continue
    for (const it of byDay.get(dayKey(d)) ?? []) monthTypes.set(it.type, it.label)
  }

  const selectedItems = byDay.get(selected) ?? []
  const selectedDate  = new Date(selected + 'T00:00:00')

  return (
    <Panel index={1} className="overflow-hidden p-3 sm:p-5">
      {/* Month header */}
      <div className="mb-3 flex items-center justify-between gap-2 px-1 sm:mb-4">
        <Press onClick={() => go(-1)} disabled={cursor <= minMonth} aria-label="Vorige maand"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-card3 text-fg2 hover:text-fg disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </Press>
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-lg font-semibold capitalize tracking-tight text-fg">
            {NL_MONTHS_LONG[month]} <span className="text-fg3">{year}</span>
          </p>
          {cursor !== monthIndex(today) && (
            <button onClick={() => { setDir(cursor > monthIndex(today) ? -1 : 1); setCursor(monthIndex(today)); setSelected(todayKey) }}
              className="rounded-lg bg-card3 px-2 py-1 text-[11px] font-medium text-fg2 transition-colors hover:text-fg">
              Vandaag
            </button>
          )}
        </div>
        <Press onClick={() => go(1)} disabled={cursor >= maxMonth} aria-label="Volgende maand"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-card3 text-fg2 hover:text-fg disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </Press>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 pb-1.5 sm:gap-1.5">
        {NL_WEEKDAYS_MON.map(d => <p key={d} className="text-center label-caps">{d}</p>)}
      </div>

      {/* Day grid — swipe left/right to change month */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={cursor}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1) }}
            className="grid touch-pan-y grid-cols-7 gap-1 sm:gap-1.5"
          >
            {days.map(d => {
              const k        = dayKey(d)
              const inMonth  = d.getMonth() === month
              const isToday  = k === todayKey
              const isPast   = k < todayKey
              const isSel    = k === selected
              const dayItems = byDay.get(k) ?? []
              const first    = dayItems[0] ? afvalColor(dayItems[0].type) : null
              return (
                <button
                  key={k}
                  onClick={() => setSelected(k)}
                  className={cn(
                    'relative flex min-h-[52px] flex-col rounded-xl p-1 text-left transition-colors sm:min-h-[84px] sm:rounded-2xl sm:p-1.5',
                    inMonth ? 'bg-card3' : 'opacity-35',
                    isPast && inMonth && 'opacity-55',
                    isSel ? 'ring-1 ring-[var(--c-fg3)]' : 'hover:bg-card4',
                  )}
                  style={first && inMonth && !isPast ? { background: `${first}14`, boxShadow: `inset 0 0 0 1px ${first}33` } : undefined}
                >
                  <span className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular',
                    isToday ? 'bg-accent' : inMonth ? 'text-fg' : 'text-fg3',
                  )}>
                    {d.getDate()}
                  </span>
                  {/* Phones: coloured dots; wider screens: labelled chips */}
                  {dayItems.length > 0 && (
                    <>
                      <span className="mt-auto flex flex-wrap gap-0.5 px-0.5 pb-0.5 sm:hidden">
                        {dayItems.map((it, i) => (
                          <span key={i} className="h-2 w-2 rounded-full" style={{ background: afvalColor(it.type), boxShadow: `0 0 6px ${afvalColor(it.type)}` }} />
                        ))}
                      </span>
                      <span className="mt-1 hidden flex-col gap-0.5 sm:flex">
                        {dayItems.map((it, i) => {
                          const c = afvalColor(it.type)
                          return (
                            <span key={i} className="flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold leading-tight"
                              style={{ background: `${c}26`, color: c }}>
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c }} />
                              <span className="truncate">{it.label}</span>
                            </span>
                          )
                        })}
                      </span>
                    </>
                  )}
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Selected day + legend */}
      <div className="mt-3 flex flex-col gap-3 border-t border-subtle px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="label-caps capitalize">
            {selectedDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="mt-0.5 text-sm font-medium text-fg">
            {selectedItems.length === 0
              ? <span className="text-fg3">Niets aan de straat</span>
              : selectedItems.map(i => i.label).join(' + ') + ' aan de straat'}
          </p>
        </div>
        {monthTypes.size > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {[...monthTypes].map(([type, label]) => (
              <span key={type} className="flex items-center gap-1.5 text-xs text-fg2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: afvalColor(type) }} />{label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}

export function AfvalWidget() {
  const [view, setView] = useLocalStorage<View>('afval-view', 'lijst')
  const { data: upcoming = [], isLoading } = useQuery<AfvalItem[]>({
    queryKey: ['afval', 'upcoming'], queryFn: afvalApi.getUpcoming,
    refetchInterval: 60 * 60_000, staleTime: 60 * 60_000,
  })
  const { data: all = [] } = useQuery<AfvalItem[]>({
    queryKey: ['afval', 'all'], queryFn: afvalApi.getAll,
    staleTime: 60 * 60_000, enabled: view === 'kalender',
  })

  const next = upcoming[0]

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className={cn('mx-auto flex flex-col gap-4 pb-4', view === 'kalender' ? 'max-w-4xl' : 'max-w-2xl')}>
        <div className="flex justify-center">
          <Segmented layoutId="afval-view" size="sm" value={view} onChange={setView}
            items={[
              { id: 'lijst',    label: <span className="flex items-center gap-1.5"><List className="h-3.5 w-3.5" />Lijst</span> },
              { id: 'kalender', label: <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Kalender</span> },
            ]} />
        </div>

        {isLoading ? (
          <><Skeleton className="h-32 rounded-3xl" /><Skeleton className="h-72 rounded-3xl" /></>
        ) : upcoming.length === 0 && all.length === 0 ? (
          <Panel className="flex p-8">
            <EmptyState icon={<Trash2 className="h-5 w-5" />} title="Geen ophaaldata gevonden" hint="Stel Afval:ICalUrl in appsettings.json in" />
          </Panel>
        ) : (
          <>
            {next && <NextCollection next={next} />}
            {view === 'lijst' ? <ListView items={upcoming} /> : <CalendarView items={all} />}
          </>
        )}
      </div>
    </div>
  )
}
