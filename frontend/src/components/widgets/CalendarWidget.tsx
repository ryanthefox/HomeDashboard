import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, RefreshCw, List, Grid3x3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calendarApi, type CalendarEvent } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { dayKey, monthGrid, monthIndex, NL_MONTHS_LONG, NL_WEEKDAYS_MON } from '@/lib/afval'
import {
  useCalendar, visibleEvents, eventsByDay, upcoming, timeRange, dayTitle, calendarColor, CALENDAR_VISIBLE_KEY,
} from '@/lib/calendar'
import { Panel, Press, Segmented, Skeleton, EmptyState } from '@/components/ui/motion'

type View = 'lijst' | 'maand'

// ── One event ─────────────────────────────────────────────────────────────────
function EventRow({ ev, day, calendarName, index = 0 }: { ev: CalendarEvent; day?: string; calendarName?: string; index?: number }) {
  const color = calendarColor(ev.calendar)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 10) * 0.03, duration: 0.3 }}
      className="flex items-stretch gap-3 rounded-2xl bg-card3 px-3 py-2.5"
    >
      <span className="w-1 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}66` }} />
      <div className="w-[84px] shrink-0 pt-px text-xs font-medium text-fg2 tabular sm:w-24">{timeRange(ev, day)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg">{ev.title}</p>
        {(ev.location || calendarName) && (
          <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-xs text-fg3">
            {ev.location && <><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{ev.location}</span></>}
            {ev.location && calendarName && <span className="shrink-0">·</span>}
            {calendarName && <span className="shrink-0">{calendarName}</span>}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ── List view: upcoming days ──────────────────────────────────────────────────
function ListView({ events, names }: { events: CalendarEvent[]; names: Map<number, string> | null }) {
  const days = useMemo(() => {
    const byDay = eventsByDay(upcoming(events, 60))
    const today = dayKey(new Date())
    return [...byDay.entries()].filter(([k]) => k >= today).sort(([a], [b]) => a.localeCompare(b))
  }, [events])

  if (days.length === 0) return <Panel className="flex p-8"><EmptyState icon={<CalendarDays className="h-5 w-5" />} title="Niets gepland" hint="De komende twee maanden staat er niets in je agenda" /></Panel>

  let i = 0
  return (
    <div className="flex flex-col gap-4">
      {days.map(([key, list]) => {
        const { title, sub } = dayTitle(key)
        return (
          <Panel key={key} index={Math.min(i++, 6)} className="p-4 sm:p-5">
            <div className="mb-3 flex items-baseline gap-2">
              <p className="text-base font-semibold tracking-tight text-fg">{title}</p>
              {sub && <p className="text-xs text-fg3">{sub}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              {list.map((ev, n) => <EventRow key={ev.id} ev={ev} day={key} index={n} calendarName={names?.get(ev.calendar)} />)}
            </div>
          </Panel>
        )
      })}
    </div>
  )
}

// ── Month view ────────────────────────────────────────────────────────────────
function MonthView({ events, names }: { events: CalendarEvent[]; names: Map<number, string> | null }) {
  const today = new Date()
  const todayKey = dayKey(today)
  const [cursor, setCursor] = useState(() => monthIndex(today))
  const [dir, setDir] = useState(0)
  const [selected, setSelected] = useState(todayKey)
  const byDay = useMemo(() => eventsByDay(events), [events])

  const year = Math.floor(cursor / 12), month = cursor % 12
  const days = monthGrid(year, month)
  const go = (d: -1 | 1) => { setDir(d); setCursor(c => c + d) }
  const selectedList = byDay.get(selected) ?? []
  const sel = dayTitle(selected)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel index={0} className="overflow-hidden p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2 px-1 sm:mb-4">
          <Press onClick={() => go(-1)} aria-label="Vorige maand" className="flex h-9 w-9 items-center justify-center rounded-xl bg-card3 text-fg2 hover:text-fg">
            <ChevronLeft className="h-4 w-4" />
          </Press>
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-lg font-semibold capitalize tracking-tight text-fg">{NL_MONTHS_LONG[month]} <span className="text-fg3">{year}</span></p>
            {cursor !== monthIndex(today) && (
              <button onClick={() => { setDir(cursor > monthIndex(today) ? -1 : 1); setCursor(monthIndex(today)); setSelected(todayKey) }}
                className="rounded-lg bg-card3 px-2 py-1 text-[11px] font-medium text-fg2 hover:text-fg">Vandaag</button>
            )}
          </div>
          <Press onClick={() => go(1)} aria-label="Volgende maand" className="flex h-9 w-9 items-center justify-center rounded-xl bg-card3 text-fg2 hover:text-fg">
            <ChevronRight className="h-4 w-4" />
          </Press>
        </div>

        <div className="grid grid-cols-7 gap-1 px-0.5 pb-1">
          {NL_WEEKDAYS_MON.map(d => <p key={d} className="text-center text-[11px] font-medium uppercase tracking-wider text-fg3">{d}</p>)}
        </div>

        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div key={cursor} custom={dir}
            initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.25 }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
            onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1) }}
            className="grid grid-cols-7 gap-1"
          >
            {days.map(d => {
              const k = dayKey(d)
              const list = byDay.get(k) ?? []
              const inMonth = d.getMonth() === month
              const isToday = k === todayKey
              const isSel = k === selected
              return (
                <button key={k} onClick={() => setSelected(k)}
                  className={cn('flex min-h-[52px] flex-col items-stretch gap-0.5 rounded-xl p-1 text-left transition-colors sm:min-h-[84px] sm:p-1.5',
                    isSel ? 'bg-card4 ring-1 ring-white/25' : 'hover:bg-card3', !inMonth && 'opacity-35')}>
                  <span className={cn('flex h-6 w-6 items-center justify-center self-center rounded-full text-xs font-semibold tabular sm:self-start',
                    isToday ? 'bg-accent text-white' : 'text-fg2')}>{d.getDate()}</span>
                  {/* Phones: dots; larger screens: event chips */}
                  <span className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                    {list.slice(0, 4).map(ev => <span key={ev.id} className="h-1.5 w-1.5 rounded-full" style={{ background: calendarColor(ev.calendar) }} />)}
                  </span>
                  <span className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                    {list.slice(0, 3).map(ev => (
                      <span key={ev.id} className="truncate rounded-md px-1 py-px text-[10px] font-medium leading-tight text-fg"
                        style={{ background: `${calendarColor(ev.calendar)}33` }}>
                        {ev.title}
                      </span>
                    ))}
                    {list.length > 3 && <span className="px-1 text-[10px] text-fg3">+{list.length - 3} meer</span>}
                  </span>
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </Panel>

      <Panel index={1} className="p-4 sm:p-5">
        <div className="mb-3">
          <p className="text-base font-semibold tracking-tight text-fg">{sel.title}</p>
          {sel.sub && <p className="text-xs text-fg3">{sel.sub}</p>}
        </div>
        {selectedList.length === 0
          ? <p className="py-6 text-center text-sm text-fg3">Niets gepland</p>
          : <div className="flex flex-col gap-1.5">{selectedList.map((ev, n) => <EventRow key={ev.id} ev={ev} day={selected} index={n} calendarName={names?.get(ev.calendar)} />)}</div>}
      </Panel>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function CalendarWidget() {
  const qc = useQueryClient()
  const { data, isLoading, isError } = useCalendar()
  const [view, setView] = useLocalStorage<View>('calendar-view', 'lijst')
  const [selected, setSelected] = useLocalStorage<string[]>(CALENDAR_VISIBLE_KEY, [])
  const [refreshing, setRefreshing] = useState(false)
  const events = visibleEvents(data, selected)
  const cals = data?.calendars ?? []
  const names = cals.length > 1 ? new Map(cals.map(c => [c.index, c.name])) : null

  const refresh = async () => {
    setRefreshing(true)
    try { qc.setQueryData(['calendar'], await calendarApi.get(true)) } catch { /* ignore */ }
    setRefreshing(false)
  }
  const isOn = (i: number) => selected.length === 0 || selected.includes(String(i))
  const toggle = (i: number) => {
    const all = cals.map(c => String(c.index))
    const base = selected.length === 0 ? all : selected
    const next = base.includes(String(i)) ? base.filter(x => x !== String(i)) : [...base, String(i)]
    if (next.length === 0) return
    setSelected(next.length === all.length ? [] : next)
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 pb-4">
        {isLoading ? (
          <div className="flex flex-col gap-4">{[0, 1, 2].map(i => <Skeleton key={i} className="h-36 rounded-3xl" />)}</div>
        ) : isError || !data ? (
          <Panel className="flex p-8"><EmptyState icon={<CalendarDays className="h-5 w-5" />} title="Agenda niet bereikbaar" hint="Probeer het later opnieuw" /></Panel>
        ) : !data.configured ? (
          <Panel className="flex p-8">
            <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="Nog geen agenda gekoppeld"
              hint="Zet het geheime iCal-adres van je Google Agenda in CALENDAR_ICS_URLS in de .env op de server" />
          </Panel>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {cals.map(c => {
                  const on = isOn(c.index)
                  const color = calendarColor(c.index)
                  return (
                    <button key={c.index} onClick={() => toggle(c.index)} disabled={cals.length < 2}
                      className={cn('flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
                        on ? 'bg-card4 text-fg' : 'bg-card3 text-fg3', cals.length < 2 && 'cursor-default')}>
                      <span className="h-2.5 w-2.5 rounded-full transition-opacity" style={{ background: color, opacity: on ? 1 : 0.3 }} />
                      {c.name}
                      {c.error && <span className="text-red-400">· fout</span>}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => void refresh()} title="Vernieuwen" className="flex h-9 w-9 items-center justify-center rounded-xl bg-card3 text-fg2 hover:text-fg">
                  <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                </button>
                <Segmented size="sm" layoutId="calendar-view" value={view} onChange={setView} items={[
                  { id: 'lijst', label: <span className="flex items-center gap-1.5"><List className="h-3.5 w-3.5" />Lijst</span> },
                  { id: 'maand', label: <span className="flex items-center gap-1.5"><Grid3x3 className="h-3.5 w-3.5" />Maand</span> },
                ]} />
              </div>
            </div>
            {view === 'lijst' ? <ListView events={events} names={names} /> : <MonthView events={events} names={names} />}
          </>
        )}
      </div>
    </div>
  )
}
