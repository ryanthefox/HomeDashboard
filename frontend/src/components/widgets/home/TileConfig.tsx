import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hueApi, aircoApi, ringApi, type HueRoom, type AircoDevice, type RingStatus } from '@/lib/api'
import { RING_MOTION_ALERT_KEY } from '@/lib/ring'
import { useLocalStorage } from '@/hooks/useLocalStorage'

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
