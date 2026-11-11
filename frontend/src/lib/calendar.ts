import { useQuery } from '@tanstack/react-query'
import { calendarApi, type CalendarData, type CalendarEvent } from '@/lib/api'
import { dayKey } from '@/lib/afval'

export const CALENDAR_VISIBLE_KEY = 'calendar-visible'
export const CALENDAR_COLORS = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#22d3ee', '#f87171']
export const calendarColor = (index: number) => CALENDAR_COLORS[index % CALENDAR_COLORS.length]

export function useCalendar() {
  return useQuery<CalendarData>({
    queryKey: ['calendar'], queryFn: () => calendarApi.get(),
    staleTime: 5 * 60_000, refetchInterval: 10 * 60_000,
  })
}

/** Filter by the calendars chosen in the settings (empty = all). */
export function visibleEvents(data: CalendarData | undefined, selected: string[]) {
  const events = data?.events ?? []
  if (!selected.length) return events
  const on = new Set(selected.map(Number))
  const any = data?.calendars.some(c => on.has(c.index))
  return any ? events.filter(e => on.has(e.calendar)) : events
}

/** All-day events carry a plain date; timed events are UTC. Both parse to the right local moment. */
export const evStart = (e: CalendarEvent) => new Date(e.start)
export const evEnd = (e: CalendarEvent) => new Date(e.end)

/** Every local day (key) an event touches — multi-day events show on each day. */
export function eventDays(e: CalendarEvent): string[] {
  const s = evStart(e), end = evEnd(e)
  const last = new Date(end.getTime() - (e.allDay ? 1 : 0) - (!e.allDay && end > s ? 1 : 0))
  const days: string[] = []
  const d = new Date(s.getFullYear(), s.getMonth(), s.getDate())
  for (let i = 0; i < 62 && d <= last; i++) { days.push(dayKey(d)); d.setDate(d.getDate() + 1) }
  return days.length ? days : [dayKey(s)]
}

export function eventsByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>()
  for (const e of events) for (const k of eventDays(e)) {
    const list = map.get(k); if (list) list.push(e); else map.set(k, [e])
  }
  for (const list of map.values()) list.sort((a, b) => Number(b.allDay) - Number(a.allDay) || evStart(a).getTime() - evStart(b).getTime())
  return map
}

export const hhmm = (d: Date) => d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

export function timeRange(e: CalendarEvent, day?: string) {
  if (e.allDay) return 'Hele dag'
  const s = evStart(e), en = evEnd(e)
  // Multi-day timed event: show what applies to this day
  if (day && dayKey(s) !== day) return dayKey(en) === day ? `tot ${hhmm(en)}` : 'Hele dag'
  if (day && dayKey(en) !== day) return `vanaf ${hhmm(s)}`
  return en > s ? `${hhmm(s)} – ${hhmm(en)}` : hhmm(s)
}

export function dayTitle(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000)
  const long = date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  if (diff === 0) return { title: 'Vandaag', sub: long }
  if (diff === 1) return { title: 'Morgen', sub: long }
  if (diff === -1) return { title: 'Gisteren', sub: long }
  return { title: long.charAt(0).toUpperCase() + long.slice(1), sub: null as string | null }
}

/** Upcoming events from now: timed events that already ended today are skipped. */
export function upcoming(events: CalendarEvent[], days = 60) {
  const now = new Date()
  const limit = new Date(now); limit.setDate(now.getDate() + days)
  return events.filter(e => evEnd(e) > now && evStart(e) < limit)
}
