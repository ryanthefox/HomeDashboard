import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Check, Search, Loader2, Home, Briefcase, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hueApi, aircoApi, ringApi, travelApi, type HueRoom, type AircoDevice, type RingStatus, type StationRef, type TravelSettings } from '@/lib/api'
import { RING_MOTION_ALERT_KEY } from '@/lib/ring'
import { useCalendar, CALENDAR_VISIBLE_KEY } from '@/lib/calendar'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Dialog } from '@/components/ui/Dialog'

// Which rooms / airco units a home tile shows. Empty list = show all.
export const HUE_VISIBLE_KEY   = 'home-hue-rooms'
export const AIRCO_VISIBLE_KEY = 'home-ac-devices'
export const SYSTEM_VISIBLE_KEY = 'home-system-items'

export const SYSTEM_ITEMS = [
  { id: 'cpu',     label: 'CPU' },
  { id: 'gpu',     label: 'GPU' },
  { id: 'ram',     label: 'Geheugen (RAM)' },
  { id: 'disk',    label: 'Schijf (totaal)' },
  { id: 'network', label: 'Netwerk' },
  { id: 'drives',  label: 'Schijven per stuk' },
] as const
export type SystemItem = typeof SYSTEM_ITEMS[number]['id']

export const RING_VISIBLE_KEY = 'home-ring-cameras'
export const TRAVEL_VISIBLE_KEY = 'home-travel-items'
export const TRAVEL_ITEMS = [
  { id: 'car',   label: 'Auto (met files)' },
  { id: 'train', label: 'Trein (NS)' },
] as const
export const ENERGY_VISIBLE_KEY = 'home-energy-items'
export const ENERGY_ITEMS = [
  { id: 'price',    label: 'Stroomprijs nu' },
  { id: 'cheapest', label: 'Goedkoopste 3 uur' },
  { id: 'extremes', label: 'Goedkoopste en duurste uur' },
  { id: 'gas',      label: 'Gasprijs' },
  { id: 'chart',    label: 'Prijsgrafiek vandaag' },
  { id: 'usage',    label: 'Verbruik laatste dag' },
  { id: 'month',    label: 'Kosten deze maand' },
] as const
export type EnergyItem = typeof ENERGY_ITEMS[number]['id']

/** Items the user picked; falls back to all when nothing (still existing) is picked. */
export function pickVisible<T>(all: T[] | undefined, selected: string[], id: (x: T) => string): T[] {
  if (!all) return []
  const shown = selected.length ? all.filter(x => selected.includes(id(x))) : all
  return shown.length ? shown : all
}

function ItemPicker({ hint, items, selected, onChange }: {
  hint: string
  items: { id: string; label: string }[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const ids = items.map(i => i.id)
  const current = selected.filter(id => ids.includes(id))
  const isOn = (id: string) => current.length === 0 || current.includes(id)

  const toggle = (id: string) => {
    const base = current.length === 0 ? ids : current
    const next = base.includes(id) ? base.filter(x => x !== id) : [...base, id]
    if (next.length === 0) return // keep at least one
    onChange(next.length === ids.length ? [] : ids.filter(x => next.includes(x)))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="mb-1 text-xs text-fg3">{hint}</p>
      {items.map(item => {
        const on = isOn(item.id)
        return (
          <motion.button key={item.id} whileTap={{ scale: 0.97 }} onClick={() => toggle(item.id)}
            className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors',
              on ? 'bg-card4 text-fg' : 'bg-card3 text-fg3')}>
            <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
              on ? 'border-transparent bg-accent' : 'border-subtle2')}>
              {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <span className="truncate">{item.label}</span>
          </motion.button>
        )
      })}
      {current.length > 0 && (
        <button onClick={() => onChange([])} className="mt-1 self-start text-xs font-medium text-fg2 underline-offset-2 hover:text-fg hover:underline">
          Alles tonen
        </button>
      )}
    </div>
  )
}

export function HueTileConfig() {
  const { data: rooms = [] } = useQuery<HueRoom[]>({ queryKey: ['hue', 'rooms'], queryFn: hueApi.getRooms, staleTime: 10_000 })
  const [selected, setSelected] = useLocalStorage<string[]>(HUE_VISIBLE_KEY, [])
  return (
    <ItemPicker hint="Kies welke ruimtes deze tegel toont. Eén ruimte = geen tabbladen."
      items={rooms.map(r => ({ id: r.id, label: r.name }))} selected={selected} onChange={setSelected} />
  )
}

export function SystemTileConfig() {
  const [selected, setSelected] = useLocalStorage<string[]>(SYSTEM_VISIBLE_KEY, [])
  return (
    <ItemPicker hint="Kies wat deze tegel toont. Minder onderdelen = grotere meters."
      items={SYSTEM_ITEMS.map(i => ({ id: i.id, label: i.label }))} selected={selected} onChange={setSelected} />
  )
}

export function EnergyTileConfig() {
  const [selected, setSelected] = useLocalStorage<string[]>(ENERGY_VISIBLE_KEY, [])
  return (
    <ItemPicker hint="Kies wat de Energie-tegel toont. Verbruik en kosten werken alleen met je Frank-login."
      items={ENERGY_ITEMS.map(i => ({ id: i.id, label: i.label }))} selected={selected} onChange={setSelected} />
  )
}

function StationField({ label, icon, value, envCode, onChange }: {
  label: string; icon: React.ReactNode; value: StationRef | null; envCode: string | null; onChange: (s: StationRef | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<StationRef[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open || q.trim().length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setBusy(true); setErr(null)
      try { setResults(await travelApi.searchStations(q)) } catch (e) { setErr(e instanceof Error ? e.message : 'Zoeken mislukt'); setResults([]) }
      setBusy(false)
    }, 300)
    return () => clearTimeout(t)
  }, [q, open])

  const close = () => { setOpen(false); setQ('') }
  const pick = (s: StationRef | null) => { onChange(s); close() }
  const current = value ? `${value.name} (${value.code})` : envCode ? `${envCode} (uit .env)` : 'Niet ingesteld'

  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-card3 p-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card4 text-fg2 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-fg3">{label}</p>
        <p className="truncate text-sm font-medium text-fg">{current}</p>
      </div>
      <button onClick={() => setOpen(true)} className="shrink-0 rounded-lg bg-card4 px-2.5 py-1 text-xs font-medium text-fg2 hover:text-fg">Wijzigen</button>

      <Dialog open={open} onClose={close} title={`Station ${label.toLowerCase()}`} className="max-w-md">
        <div className="p-4 pt-1">
          <div className="flex items-center gap-2 rounded-xl bg-card3 px-3">
            <Search className="h-4 w-4 shrink-0 text-fg3" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Zoek station, bijv. Arnhem"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-fg outline-none placeholder:text-fg3" />
            {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-fg3" />}
          </div>
          {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
          <div className="mt-2 flex max-h-[50vh] min-h-[120px] flex-col gap-0.5 overflow-y-auto">
            {results.map(s => (
              <button key={s.code} onClick={() => pick(s)}
                className={cn('flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-fg hover:bg-card3', value?.code === s.code && 'bg-card3')}>
                <span className="truncate">{s.name}</span><span className="shrink-0 text-xs text-fg3">{s.code}</span>
              </button>
            ))}
            {!busy && !err && q.trim().length >= 2 && results.length === 0 && <p className="px-3 py-3 text-sm text-fg3">Geen station gevonden</p>}
            {q.trim().length < 2 && <p className="px-3 py-3 text-sm text-fg3">Typ minstens twee letters</p>}
          </div>
          {value && envCode && (
            <button onClick={() => pick(null)} className="mt-2 flex items-center gap-1.5 px-1 text-xs text-fg3 hover:text-fg">
              <X className="h-3 w-3" /> Terug naar {envCode} uit .env
            </button>
          )}
        </div>
      </Dialog>
    </div>
  )
}

export function StationSettings() {
  const qc = useQueryClient()
  const { data } = useQuery<TravelSettings>({ queryKey: ['travel', 'settings'], queryFn: travelApi.getSettings })
  const [saving, setSaving] = useState(false)
  if (!data) return null
  if (!data.nsConfigured) return <p className="text-xs text-fg3">Zet eerst NS_API_KEY in de .env op de server om stations te kunnen kiezen.</p>

  const save = async (home: StationRef | null, work: StationRef | null) => {
    setSaving(true)
    try {
      qc.setQueryData(['travel', 'settings'], await travelApi.saveStations(home, work))
      await qc.invalidateQueries({ queryKey: ['travel'] })
    } finally { setSaving(false) }
  }
  return (
    <div className="flex flex-col gap-1.5">
      <p className="mb-1 flex items-center gap-1.5 text-xs text-fg3">Treinstations (geldt voor al je schermen){saving && <Loader2 className="h-3 w-3 animate-spin" />}</p>
      <StationField label="Thuis" icon={<Home />} value={data.homeStation} envCode={data.envHomeStation} onChange={s => void save(s, data.workStation)} />
      <StationField label="Werk" icon={<Briefcase />} value={data.workStation} envCode={data.envWorkStation} onChange={s => void save(data.homeStation, s)} />
    </div>
  )
}

export function TravelTileConfig() {
  const [selected, setSelected] = useLocalStorage<string[]>(TRAVEL_VISIBLE_KEY, [])
  return (
    <div className="flex flex-col gap-5">
      <ItemPicker hint="Kies wat de Reistijd-tegel toont. 's Ochtends toont hij de reis naar je werk, 's middags naar huis."
        items={TRAVEL_ITEMS.map(i => ({ id: i.id, label: i.label }))} selected={selected} onChange={setSelected} />
      <StationSettings />
    </div>
  )
}

export function CalendarTileConfig() {
  const { data } = useCalendar()
  const [selected, setSelected] = useLocalStorage<string[]>(CALENDAR_VISIBLE_KEY, [])
  const cals = data?.calendars ?? []
  return cals.length > 1
    ? <ItemPicker hint="Kies welke agenda's je ziet (geldt ook voor de Agenda-tab)."
        items={cals.map(c => ({ id: String(c.index), label: c.name }))} selected={selected} onChange={setSelected} />
    : <p className="text-xs text-fg3">Je hebt één agenda gekoppeld. Voeg er meer toe in CALENDAR_ICS_URLS (komma-gescheiden) om hier te kunnen kiezen.</p>
}

export function RingTileConfig() {
  const { data: status } = useQuery<RingStatus>({ queryKey: ['ring', 'status'], queryFn: ringApi.getStatus, staleTime: 20_000 })
  const [selected, setSelected] = useLocalStorage<string[]>(RING_VISIBLE_KEY, [])
  const [motionAlerts, setMotionAlerts] = useLocalStorage<boolean>(RING_MOTION_ALERT_KEY, true)
  const cams = status?.cameras ?? []
  return (
    <div className="flex flex-col gap-4">
      {cams.length > 0
        ? <ItemPicker hint="Kies welke camera's deze tegel toont. Eén camera = geen tabbladen."
            items={cams.map(c => ({ id: c.id, label: c.name }))} selected={selected} onChange={setSelected} />
        : <p className="text-xs text-fg3">Koppel eerst je Ring-account via de tegel.</p>}
      <div>
        <p className="mb-1.5 text-xs text-fg3">Meldingen op dit scherm</p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setMotionAlerts(v => !v)}
          className={cn('flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors',
            motionAlerts ? 'bg-card4 text-fg' : 'bg-card3 text-fg3')}>
          <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
            motionAlerts ? 'border-transparent bg-accent' : 'border-subtle2')}>
            {motionAlerts && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
          Melding bij beweging
        </motion.button>
        <p className="mt-1.5 text-[11px] text-fg3">Bij aanbellen krijg je altijd een melding.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => void ringApi.test('ding')} className="rounded-xl bg-card4 px-3 py-1.5 text-xs font-medium text-fg2 hover:text-fg">Test aanbellen</button>
        <button onClick={() => void ringApi.test('motion')} className="rounded-xl bg-card4 px-3 py-1.5 text-xs font-medium text-fg2 hover:text-fg">Test beweging</button>
      </div>
    </div>
  )
}

export function AircoTileConfig() {
  const { data: devices = [] } = useQuery<AircoDevice[]>({ queryKey: ['airco', 'devices'], queryFn: aircoApi.getDevices, staleTime: 30_000 })
  const [selected, setSelected] = useLocalStorage<string[]>(AIRCO_VISIBLE_KEY, [])
  return (
    <ItemPicker hint="Kies welke airco's deze tegel toont. Eén airco = geen tabbladen."
      items={devices.map(d => ({ id: d.deviceId, label: d.name }))} selected={selected} onChange={setSelected} />
  )
}
