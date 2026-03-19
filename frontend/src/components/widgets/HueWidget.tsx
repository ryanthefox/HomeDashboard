import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hueApi, type HueRoom, type HueLight, type HueScene } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// ── Color helpers ─────────────────────────────────────────────────────────────
function roomGradient(room: HueRoom): string {
  if (!room.anyOn) return 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)'

  const onLights = room.lights.filter(l => l.isOn)
  if (onLights.length === 0) return 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)'

  // Check if any lights have color
  const colorLight = onLights.find(l => l.colorHue != null && l.colorSat != null && (l.colorSat ?? 0) > 50)
  if (colorLight && colorLight.colorHue != null && colorLight.colorSat != null) {
    const h = Math.round((colorLight.colorHue / 65535) * 360)
    const s = Math.round((colorLight.colorSat / 254) * 80)
    return `linear-gradient(135deg, hsl(${h},${s}%,18%) 0%, hsl(${h},${s}%,30%) 100%)`
  }

  // Use average color temp
  const ctLights = onLights.filter(l => l.colorTemp != null)
  if (ctLights.length > 0) {
    const avgCt = ctLights.reduce((sum, l) => sum + (l.colorTemp ?? 300), 0) / ctLights.length
    // 153=cool/blue, 500=warm/amber
    const t = (avgCt - 153) / (500 - 153) // 0=cool, 1=warm
    if (t > 0.6) {
      return 'linear-gradient(135deg, #2d1f0a 0%, #3d2a10 100%)'
    } else if (t > 0.3) {
      return 'linear-gradient(135deg, #221a0e 0%, #332614 100%)'
    } else {
      return 'linear-gradient(135deg, #0d1a2d 0%, #122040 100%)'
    }
  }

  // Default warm
  return 'linear-gradient(135deg, #221a0e 0%, #332614 100%)'
}

function roomAccentColor(room: HueRoom): string {
  if (!room.anyOn) return '#6b6b6b'

  const onLights = room.lights.filter(l => l.isOn)
  const colorLight = onLights.find(l => l.colorHue != null && (l.colorSat ?? 0) > 50)
  if (colorLight && colorLight.colorHue != null && colorLight.colorSat != null) {
    const h = Math.round((colorLight.colorHue / 65535) * 360)
    const s = Math.round((colorLight.colorSat / 254) * 90)
    return `hsl(${h},${s}%,55%)`
  }

  const ctLights = onLights.filter(l => l.colorTemp != null)
  if (ctLights.length > 0) {
    const avgCt = ctLights.reduce((sum, l) => sum + (l.colorTemp ?? 300), 0) / ctLights.length
    const t = (avgCt - 153) / (500 - 153)
    if (t > 0.5) return '#f5a623'
  }

  return '#f5a623'
}

function avgBrightnessPct(room: HueRoom): number {
  const on = room.lights.filter(l => l.isOn && l.isReachable)
  if (on.length === 0) return 0
  return Math.round(on.reduce((s, l) => s + l.brightness, 0) / on.length / 254 * 100)
}

// ── iOS Toggle ────────────────────────────────────────────────────────────────
function IOSToggle({ on, accent, onChange }: { on: boolean; accent: string; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onChange(!on) }}
      className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none"
      style={{ background: on ? accent : '#3a3a3c' }}
    >
      <span
        className="inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-md transition-transform duration-200"
        style={{ transform: on ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

// ── Brightness bar ────────────────────────────────────────────────────────────
function BrightnessSlider({ value, accent, onChange }: { value: number; accent: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Sun className="h-3 w-3 shrink-0 text-zinc-500" />
      <div className="relative flex-1 h-1.5 rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${value}%`, background: accent }}
        />
        <input
          type="range"
          min={1} max={100}
          value={value}
          onClick={e => e.stopPropagation()}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
      <span className="w-8 text-right text-xs text-zinc-400">{value}%</span>
    </div>
  )
}

// ── Light row (inside expanded room) ──────────────────────────────────────────
function LightRow({ light, roomId, accent }: { light: HueLight; roomId: string; accent: string }) {
  const qc = useQueryClient()

  const toggle = useMutation({
    mutationFn: (on: boolean) => hueApi.setLightState(light.id, { on }),
    onMutate: async (on) => {
      const prev = qc.getQueryData<HueRoom[]>(['hue', 'rooms'])
      qc.setQueryData<HueRoom[]>(['hue', 'rooms'], old =>
        old?.map(r => r.id === roomId
          ? { ...r, lights: r.lights.map(l => l.id === light.id ? { ...l, isOn: on } : l) }
          : r) ?? [])
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['hue', 'rooms'], ctx.prev),
  })

  const dim = useMutation({
    mutationFn: (pct: number) => hueApi.setLightState(light.id, { brightness: Math.round((pct / 100) * 254) }),
    onMutate: async (pct) => {
      const prev = qc.getQueryData<HueRoom[]>(['hue', 'rooms'])
      qc.setQueryData<HueRoom[]>(['hue', 'rooms'], old =>
        old?.map(r => r.id === roomId
          ? { ...r, lights: r.lights.map(l => l.id === light.id ? { ...l, brightness: Math.round((pct / 100) * 254) } : l) }
          : r) ?? [])
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['hue', 'rooms'], ctx.prev),
  })

  return (
    <div className="py-2">
      <div className="flex items-center gap-3">
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            background: light.isOn ? accent : '#3a3a3c',
            boxShadow: light.isOn ? `0 0 6px ${accent}` : 'none',
          }}
        />
        <span className={cn('flex-1 text-sm truncate', light.isOn ? 'text-fg' : 'text-zinc-500')}>
          {light.name}
        </span>
        <IOSToggle on={light.isOn} accent={accent} onChange={v => toggle.mutate(v)} />
      </div>
      {light.isOn && (
        <div className="mt-2 pl-5">
          <BrightnessSlider
            value={Math.round((light.brightness / 254) * 100)}
            accent={accent}
            onChange={v => dim.mutate(v)}
          />
        </div>
      )}
    </div>
  )
}

// ── Scene chips ────────────────────────────────────────────────────────────────
function SceneChips({ roomId }: { roomId: string }) {
  const qc = useQueryClient()

  const { data: scenes } = useQuery<HueScene[]>({
    queryKey: ['hue', 'scenes', roomId],
    queryFn: () => hueApi.getScenes(roomId),
    staleTime: 60_000,
  })

  const activate = useMutation({
    mutationFn: (sceneId: string) => hueApi.activateScene(roomId, sceneId),
    onSuccess: () => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ['hue', 'rooms'] }), 600)
    },
  })

  if (!scenes || scenes.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {scenes.map(scene => (
        <button
          key={scene.id}
          onClick={e => { e.stopPropagation(); activate.mutate(scene.id) }}
          className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-white/30 hover:text-fg active:scale-95"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          {scene.name}
        </button>
      ))}
    </div>
  )
}

// ── Room card ─────────────────────────────────────────────────────────────────
function RoomCard({ room, expanded, onToggle }: {
  room: HueRoom
  expanded: boolean
  onToggle: () => void
}) {
  const qc = useQueryClient()
  const accent = roomAccentColor(room)
  const bri = avgBrightnessPct(room)
  const onCount = room.lights.filter(l => l.isOn && l.isReachable).length

  const toggleRoom = useMutation({
    mutationFn: (on: boolean) => hueApi.setGroupAction(room.id, on),
    onMutate: async (on) => {
      const prev = qc.getQueryData<HueRoom[]>(['hue', 'rooms'])
      qc.setQueryData<HueRoom[]>(['hue', 'rooms'], old =>
        old?.map(r => r.id === room.id
          ? { ...r, anyOn: on, allOn: on, lights: r.lights.map(l => ({ ...l, isOn: on })) }
          : r) ?? [])
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['hue', 'rooms'], ctx.prev),
  })

  const dimRoom = useMutation({
    mutationFn: async (pct: number) => {
      const bri = Math.round((pct / 100) * 254)
      await Promise.all(
        room.lights
          .filter(l => l.isOn && l.isReachable)
          .map(l => hueApi.setLightState(l.id, { brightness: bri }))
      )
    },
    onMutate: async (pct) => {
      const prev = qc.getQueryData<HueRoom[]>(['hue', 'rooms'])
      const bri = Math.round((pct / 100) * 254)
      qc.setQueryData<HueRoom[]>(['hue', 'rooms'], old =>
        old?.map(r => r.id === room.id
          ? { ...r, lights: r.lights.map(l => l.isOn ? { ...l, brightness: bri } : l) }
          : r) ?? [])
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['hue', 'rooms'], ctx.prev),
  })

  return (
    <div
      className="overflow-hidden rounded-2xl transition-all duration-300 select-none"
      style={{ background: roomGradient(room) }}
    >
      {/* Card header — always visible */}
      <div
        className="cursor-pointer px-5 pt-5 pb-4"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {expanded
                ? <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
                : <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
              }
              <span className="font-semibold text-fg truncate">{room.name}</span>
            </div>
            <p className="mt-0.5 pl-6 text-xs text-zinc-400">
              {room.anyOn ? `${onCount} lamp${onCount !== 1 ? 'en' : ''} aan` : 'Uit'}
            </p>
          </div>
          <IOSToggle on={room.anyOn} accent={accent} onChange={v => toggleRoom.mutate(v)} />
        </div>

        {/* Brightness slider (only when on) */}
        {room.anyOn && (
          <div className="mt-4 pl-6">
            <BrightnessSlider
              value={bri}
              accent={accent}
              onChange={v => dimRoom.mutate(v)}
            />
          </div>
        )}

        {/* Scene chips */}
        {expanded && room.anyOn && (
          <div className="pl-6" onClick={e => e.stopPropagation()}>
            <SceneChips roomId={room.id} />
          </div>
        )}
      </div>

      {/* Individual lights (expanded) */}
      {expanded && room.lights.length > 0 && (
        <div className="border-t border-white/5 px-5 pb-4">
          <div className="divide-y divide-white/5">
            {room.lights.map(light => (
              <LightRow key={light.id} light={light} roomId={room.id} accent={accent} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main widget ───────────────────────────────────────────────────────────────
export function HueWidget() {
  const { data: rooms, isLoading, isError } = useQuery<HueRoom[]>({
    queryKey: ['hue', 'rooms'],
    queryFn: hueApi.getRooms,
    staleTime: 10_000,
  })

  const [expanded, setExpanded] = useLocalStorage<Record<string, boolean>>('hue-expanded', {})

  if (isLoading) return <div className="flex h-48 items-center justify-center text-zinc-500">Laden…</div>
  if (isError)   return <div className="flex h-48 items-center justify-center text-zinc-500">Bridge niet bereikbaar</div>
  if (!rooms || rooms.length === 0) return <div className="flex h-48 items-center justify-center text-zinc-500">Geen lampen gevonden</div>

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 p-1">
        {rooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            expanded={!!expanded[room.id]}
            onToggle={() => setExpanded(e => ({ ...e, [room.id]: !e[room.id] }))}
          />
        ))}
      </div>
    </div>
  )
}
