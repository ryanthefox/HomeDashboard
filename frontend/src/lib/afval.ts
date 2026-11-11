// Shared helpers for the waste-collection (afval) widgets.

export const AFVAL_COLORS: Record<string, string> = {
  gft:       '#34d399',
  papier:    '#60a5fa',
  pmd:       '#facc15',
  restafval: '#a1a1aa',
  textiel:   '#c084fc',
  grof:      '#f472b6',
  kerstbomen:'#4ade80',
}

export const afvalColor = (type: string) => AFVAL_COLORS[type.toLowerCase()] ?? '#fb923c'

const NL_DAYS   = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const NL_MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

/** Days from today (local) until the given ISO date. */
export function daysUntil(dateStr: string): number {
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  const t = new Date();        t.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - t.getTime()) / 86_400_000)
}

export function afvalDateLabel(dateStr: string): { label: string; urgent: boolean; days: number } {
  const days = daysUntil(dateStr)
  if (days === 0) return { label: 'Vandaag',    urgent: true,  days }
  if (days === 1) return { label: 'Morgen',     urgent: true,  days }
  if (days === 2) return { label: 'Overmorgen', urgent: false, days }
  const d = new Date(dateStr)
  return { label: `${NL_DAYS[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]}`, urgent: false, days }
}
