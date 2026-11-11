import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hueApi, aircoApi, type HueRoom, type AircoDevice } from '@/lib/api'
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

export function AircoTileConfig() {
  const { data: devices = [] } = useQuery<AircoDevice[]>({ queryKey: ['airco', 'devices'], queryFn: aircoApi.getDevices, staleTime: 30_000 })
  const [selected, setSelected] = useLocalStorage<string[]>(AIRCO_VISIBLE_KEY, [])
  return (
    <ItemPicker hint="Kies welke airco's deze tegel toont. Eén airco = geen tabbladen."
      items={devices.map(d => ({ id: d.deviceId, label: d.name }))} selected={selected} onChange={setSelected} />
  )
}
