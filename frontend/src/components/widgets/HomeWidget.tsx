import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Play, Pause, SkipBack, SkipForward, Music, Power, Wind, Droplets, Sun, Thermometer,
  ArrowDown, ArrowUp, Headphones, Speaker, Settings, GripVertical, X, Plus,
  ChevronRight, ChevronDown, Minus, WashingMachine, Columns2, Square,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  weatherApi, hueApi, musicApi, systemApi, audioApi, aircoApi, washerApi,
  type WeatherData, type HueRoom, type HueScene, type MediaInfo, type SystemStats,
  type AudioOutputDevice, type AircoDevice, type WasherDevice,
} from '@/lib/api'
import { ArcGauge } from '@/components/ui/ArcGauge'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { queryClient as qc } from '@/lib/queryClient'
import { formatBps } from './SystemWidget'

// ── Layout types ───────────────────────────────────────────────────────────────
type Column   = 'left' | 'middle' | 'right'
type WidgetId = 'weather' | 'music' | 'lighting' | 'system' | 'airco' | 'washer'
type WidgetSpan = 'full' | 'half'

interface HomeLayout {
  left:    WidgetId[]
  middle:  WidgetId[]
  right:   WidgetId[]
  flexMap: Partial<Record<WidgetId, number>>    // per-widget height flex weight
  spanMap: Partial<Record<WidgetId, WidgetSpan>> // per-widget width (full | half)
  colFlex: { left: number; middle: number; right: number }
}

const DEFAULT_LAYOUT: HomeLayout = {
  left:    ['weather', 'music'],
  middle:  ['lighting', 'system'],
  right:   ['airco'],
  flexMap: {},
  spanMap: {},
  colFlex: { left: 1, middle: 1.5, right: 1 },
}

const WIDGET_META: Record<WidgetId, { label: string; flex: number }> = {
  weather:  { label: 'Weer',        flex: 1 },
  music:    { label: 'Muziek',      flex: 2 },
  lighting: { label: 'Verlichting', flex: 1 },
  system:   { label: 'Systeem',     flex: 2 },
  airco:    { label: 'Airco',       flex: 1 },
  washer:   { label: 'Wasmachine',  flex: 1 },
}

// ── useContainerSize ────────────────────────────────────────────────────────────
function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

// ── Mini weather particles (subset) ────────────────────────────────────────────
const MINI_RAIN = Array.from({ length: 10 }, (_, i) => ({
  id: i, left: (i * 10.3 + 2) % 96,
  delay: (i * 0.18) % 1.8, dur: 0.5 + (i % 5) * 0.08, h: 10 + (i % 3) * 4,
}))
const MINI_SNOW = Array.from({ length: 8 }, (_, i) => ({
  id: i, left: (i * 12 + 3) % 94, size: 2.5 + (i % 2),
  delay: (i * 0.5) % 4, dur: 3 + (i % 3) * 0.5,
}))
const SUN_RAYS = [0, 45, 90, 135, 180, 225, 270, 315].map(d => {
  const r = d * Math.PI / 180
  return { x1: 60 + Math.cos(r) * 31, y1: 60 + Math.sin(r) * 31, x2: 60 + Math.cos(r) * 46, y2: 60 + Math.sin(r) * 46 }
})

function MiniCloudSvg({ style }: { style: React.CSSProperties }) {
  return (
    <svg style={style} viewBox="0 0 120 55" fill="none" aria-hidden>
      <rect x="5" y="28" width="110" height="22" rx="3" fill="#94a3b8" />
      <circle cx="25" cy="28" r="19" fill="#94a3b8" />
      <circle cx="54" cy="20" r="24" fill="#94a3b8" />
      <circle cx="85" cy="25" r="19" fill="#94a3b8" />
    </svg>
  )
}

function MiniParticles({ icon, isDay }: { icon: string; isDay: boolean }) {
  const eff = (!isDay && (icon === 'sun' || icon === 'cloud-sun')) ? 'night' : icon
  if (eff === 'cloud-rain' || eff === 'cloud-drizzle') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <style>{`@keyframes mrain{0%{transform:translateY(-5%);opacity:0}8%{opacity:.7}92%{opacity:.7}100%{transform:translateY(108%);opacity:0}}`}</style>
        {MINI_RAIN.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.left}%`, top: 0,
            width: 1.5, height: p.h,
            background: 'rgba(147,197,253,0.5)', borderRadius: 2, transform: 'rotate(-10deg)',
            animation: `mrain ${p.dur}s ${p.delay}s linear infinite`,
          }} />
        ))}
      </div>
    )
  }
  if (eff === 'snowflake') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <style>{`@keyframes msnow{0%{transform:translateY(-5%) translateX(0);opacity:0}10%{opacity:.7}90%{opacity:.7}100%{transform:translateY(108%) translateX(12px);opacity:0}}`}</style>
        {MINI_SNOW.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.left}%`, top: 0,
            width: p.size, height: p.size,
            background: 'rgba(224,242,254,.65)', borderRadius: '50%',
            animation: `msnow ${p.dur}s ${p.delay}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    )
  }
  if (eff === 'cloud-lightning') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <style>{`@keyframes mflash{0%,100%{opacity:0}3%,7%{opacity:.10}5%{opacity:.05}}`}</style>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,204,21,.1)', animation: 'mflash 4s ease-in-out infinite' }} />
      </div>
    )
  }
  if (eff === 'sun') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <style>{`
          @keyframes msunspin{to{transform:rotate(360deg)}}
          @keyframes msunglow{0%,100%{opacity:.15}50%{opacity:.25}}
        `}</style>
        <div style={{ position: 'absolute', top: '-30%', right: '-15%', width: '70%', height: '70%', background: 'radial-gradient(circle, rgba(251,191,36,.22) 0%, transparent 65%)', animation: 'msunglow 3s ease-in-out infinite' }} />
        <svg style={{ position: 'absolute', top: '-12%', right: '-12%', width: '55%', opacity: 0.18 }} viewBox="0 0 120 120" aria-hidden>
          <g style={{ transformOrigin: '60px 60px', animation: 'msunspin 14s linear infinite' }}>
            {SUN_RAYS.map((ray, i) => (
              <line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
            ))}
          </g>
          <circle cx="60" cy="60" r="24" fill="#fbbf24" opacity=".4" />
        </svg>
      </div>
    )
  }
  if (eff === 'cloud') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <style>{`
          @keyframes mcloudA{0%,100%{transform:translateX(0)}50%{transform:translateX(18px)}}
          @keyframes mcloudB{0%,100%{transform:translateX(0)}50%{transform:translateX(-12px)}}
        `}</style>
        <MiniCloudSvg style={{ position: 'absolute', top: '-5%', right: '-8%', width: '70%', opacity: 0.07, animation: 'mcloudA 9s ease-in-out infinite' }} />
        <MiniCloudSvg style={{ position: 'absolute', bottom: '5%', left: '-5%', width: '50%', opacity: 0.045, animation: 'mcloudB 12s 1.5s ease-in-out infinite' }} />
      </div>
    )
  }
  if (eff === 'cloud-sun') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <style>{`@keyframes mcsdrift{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}`}</style>
        <div style={{ position: 'absolute', top: '-25%', right: '-10%', width: '65%', height: '65%', background: 'radial-gradient(circle, rgba(251,191,36,.13) 0%, transparent 65%)' }} />
        <MiniCloudSvg style={{ position: 'absolute', top: '0%', right: '-6%', width: '65%', opacity: 0.08, animation: 'mcsdrift 10s ease-in-out infinite' }} />
      </div>
    )
  }
  if (eff === 'night') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(148,163,184,.07) 0%, transparent 70%)' }} />
      </div>
    )
  }
  return null
}

// ── Mini Weather ───────────────────────────────────────────────────────────────
function MiniWeather() {
  const ref = useRef<HTMLDivElement>(null)
  const { h } = useContainerSize(ref)
  const { data } = useQuery<WeatherData>({
    queryKey: ['weather'], queryFn: weatherApi.getCurrent, staleTime: 10 * 60_000,
  })
  const isDay = data?.isDay ?? true
  const icon  = data?.icon ?? ''

  const uvLabelShort = (uv: number) => uv <= 2 ? 'Laag' : uv <= 5 ? 'Matig' : uv <= 7 ? 'Hoog' : 'Zeer hoog'
  const uvColorStyle = (uv: number) => ({ color: uv <= 2 ? '#4ade80' : uv <= 5 ? '#fbbf24' : uv <= 7 ? '#f97316' : '#ef4444' })

  return (
    <div ref={ref} className="relative h-full rounded-2xl bg-card2 p-5 flex flex-col overflow-hidden">
      {data && <MiniParticles icon={icon} isDay={isDay} />}
      <p className="relative z-10 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Weer</p>
      {!data ? <p className="text-sm text-zinc-600">Laden…</p> : (
        <div className="relative z-10 flex-1 flex flex-col justify-between min-h-0">
          <div className="flex-1 flex flex-col justify-center gap-1 min-h-0">
            <p className={cn('font-bold text-fg leading-none', h > 220 ? 'text-6xl' : 'text-4xl')}>
              {Math.round(data.temperature)}°
            </p>
            <p className="text-sm text-zinc-400 mt-2">{data.condition}</p>
            {h > 200 && (
              <p className="text-xs text-zinc-600 mt-0.5">Voelt als {Math.round(data.feelsLike)}°</p>
            )}

            {/* Extra info rows — only when enough height */}
            {h > 300 && (
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Thermometer className="h-3 w-3 shrink-0 text-zinc-600" />
                  <span>Windstoten {Math.round(data.windGusts)} km/u</span>
                </div>
                {data.uvIndex != null && (
                  <div className="flex items-center gap-2 text-xs">
                    <Sun className="h-3 w-3 shrink-0 text-zinc-600" />
                    <span className="text-zinc-500">UV </span>
                    <span style={uvColorStyle(data.uvIndex)}>{uvLabelShort(data.uvIndex)} ({Math.round(data.uvIndex)})</span>
                  </div>
                )}
              </div>
            )}

            {h > 380 && data.sunriseTime && (
              <div className="mt-1.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <ArrowUp className="h-3 w-3 shrink-0 text-amber-400" />
                  <span>Op {data.sunriseTime}</span>
                  <span className="text-zinc-700 mx-0.5">·</span>
                  <ArrowDown className="h-3 w-3 shrink-0 text-orange-400" />
                  <span>Onder {data.sunsetTime}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 text-xs text-zinc-500 border-t border-white/5 pt-3 shrink-0">
            <span className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-400" />{Math.round(data.humidity)}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="h-3 w-3 text-zinc-400" />{Math.round(data.windSpeed)} km/u
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Audio helpers ──────────────────────────────────────────────────────────────
function DeviceIcon({ name }: { name: string }) {
  const n = name.toLowerCase()
  return n.match(/headphone|headset|koptelefoon|arctis|nova|blackshark|steelseries|corsair|jabra|sennheiser|beyerdynamic|momentum|earphone|buds/)
    ? <Headphones className="h-3 w-3 shrink-0" />
    : <Speaker    className="h-3 w-3 shrink-0" />
}
function shortName(n: string) {
  return n.replace(/\s*\(.*?\)\s*/g, '').trim().split(' ').slice(0, 3).join(' ')
}

// ── Mini Music ─────────────────────────────────────────────────────────────────
function MiniMusic() {
  const ref = useRef<HTMLDivElement>(null)
  const { h } = useContainerSize(ref)

  const { data } = useQuery<MediaInfo>({ queryKey: ['music'], queryFn: musicApi.getCurrent, refetchInterval: 5_000 })
  const { data: outputs = [] } = useQuery<AudioOutputDevice[]>({ queryKey: ['audio', 'outputs'], queryFn: audioApi.getOutputs, staleTime: 30_000 })
  const [hiddenIds, setHiddenIds]     = useLocalStorage<string[]>('audio-hidden-outputs', [])
  const [editOutputs, setEditOutputs] = useState(false)

  const play      = useMutation({ mutationFn: musicApi.play,  onSuccess: () => qc.invalidateQueries({ queryKey: ['music'] }) })
  const pause     = useMutation({ mutationFn: musicApi.pause, onSuccess: () => qc.invalidateQueries({ queryKey: ['music'] }) })
  const next      = useMutation({ mutationFn: musicApi.next,  onSuccess: () => qc.invalidateQueries({ queryKey: ['music'] }) })
  const prev      = useMutation({ mutationFn: musicApi.prev,  onSuccess: () => qc.invalidateQueries({ queryKey: ['music'] }) })
  const setOutput = useMutation({
    mutationFn: (id: string) => audioApi.setDefault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audio', 'outputs'] }),
  })

  const isPlaying   = data?.playbackStatus === 'Playing'
  const visibleOuts = outputs.filter(o => !hiddenIds.includes(o.id))
  const toggleHide  = (id: string) =>
    setHiddenIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  // Compact mode: hide album art, show outputs prominently
  const compact    = h < 280
  const showArt    = !compact && h >= 280
  const iconOnly   = h < 200

  return (
    <div ref={ref} className="h-full rounded-2xl bg-card2 overflow-hidden flex flex-col">
      {/* Album art — hidden in compact mode */}
      {showArt && (
        <div className="relative shrink-0" style={{ height: Math.min(h * 0.4, 176) }}>
          {data?.albumArtDataUrl
            ? <img src={data.albumArtDataUrl} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full flex items-center justify-center bg-card4">
                <Music className="h-10 w-10 text-zinc-700" />
              </div>
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--c-card2), transparent)' }} />
        </div>
      )}

      <div className="flex-1 flex flex-col px-4 pb-3 pt-3 min-h-0">
        {/* Compact: icon + title inline */}
        {compact && (
          <div className="flex items-center gap-2 mb-2 shrink-0">
            {data?.albumArtDataUrl
              ? <img src={data.albumArtDataUrl} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
              : <div className="h-8 w-8 rounded-lg bg-card4 flex items-center justify-center shrink-0">
                  <Music className="h-4 w-4 text-zinc-600" />
                </div>
            }
            {!iconOnly && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-fg truncate">{data?.title ?? 'Geen media'}</p>
                {data?.artist && <p className="text-[10px] text-zinc-500 truncate">{data.artist}</p>}
              </div>
            )}
          </div>
        )}

        {/* Title in non-compact mode */}
        {!compact && (
          <div className="mb-2 shrink-0">
            {data?.title
              ? <>
                  <p className="text-sm font-semibold text-fg truncate">{data.title}</p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{data.artist}</p>
                </>
              : <p className="text-xs text-zinc-600">Geen media actief</p>
            }
          </div>
        )}

        {/* Controls */}
        <div className={cn('flex items-center justify-center gap-2 shrink-0', compact ? 'mb-2' : 'mb-3')}>
          <button onClick={() => prev.mutate()} disabled={!data?.canSkipPrev}
            className="p-1.5 text-zinc-500 hover:text-fg disabled:opacity-30">
            <SkipBack className="h-4 w-4" />
          </button>
          <button onClick={() => isPlaying ? pause.mutate() : play.mutate()}
            className={cn('flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform',
              compact ? 'h-8 w-8' : 'h-10 w-10')}>
            {isPlaying ? <Pause className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> : <Play className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4', 'translate-x-0.5')} />}
          </button>
          <button onClick={() => next.mutate()} disabled={!data?.canSkipNext}
            className="p-1.5 text-zinc-500 hover:text-fg disabled:opacity-30">
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Audio outputs */}
        {outputs.length > 0 && (
          <div className="border-t border-white/5 pt-2 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-zinc-600">Uitvoer</p>
              <button onClick={() => setEditOutputs(e => !e)}
                className={cn('transition-colors', editOutputs ? 'text-orange-400' : 'text-zinc-600 hover:text-zinc-400')}>
                <Settings className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-1">
              {editOutputs
                ? outputs.map(o => (
                    <label key={o.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!hiddenIds.includes(o.id)}
                        onChange={() => toggleHide(o.id)} className="accent-orange-500" />
                      <span className="text-xs text-zinc-300 truncate">{shortName(o.name)}</span>
                    </label>
                  ))
                : visibleOuts.map(o => (
                    <button key={o.id} onClick={() => setOutput.mutate(o.id)} disabled={setOutput.isPending}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl px-2 text-xs font-medium w-full text-left transition-all',
                        compact ? 'py-1' : 'py-1.5 px-2.5',
                        o.isDefault ? 'bg-orange-500 text-white' : 'bg-elev text-zinc-400 hover:text-zinc-200'
                      )}>
                      <DeviceIcon name={o.name} />
                      {!iconOnly && <span className="truncate">{shortName(o.name)}</span>}
                    </button>
                  ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Hue helpers (shared with HueWidget) ────────────────────────────────────────
function roomAccentColor(room: HueRoom): string {
  const on = room.lights.filter(l => l.isOn)
  const c = on.find(l => l.colorHue != null && (l.colorSat ?? 0) > 50)
  if (c && c.colorHue != null && c.colorSat != null) {
    const h = Math.round((c.colorHue / 65535) * 360)
    const s = Math.round((c.colorSat / 254) * 90)
    return `hsl(${h},${s}%,55%)`
  }
  const ctL = on.filter(l => l.colorTemp != null)
  if (ctL.length > 0) {
    const avg = ctL.reduce((s, l) => s + (l.colorTemp ?? 300), 0) / ctL.length
    if ((avg - 153) / 347 > 0.5) return '#f5a623'
  }
  return '#f5a623'
}

function HueIOSToggle({ on, accent, onChange, small }: { on: boolean; accent: string; onChange: (v: boolean) => void; small?: boolean }) {
  const w = small ? 'w-9' : 'w-12', h = small ? 'h-[22px]' : 'h-7'
  const knob = small ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]'
  const tx = small ? (on ? 'translate-x-[18px]' : 'translate-x-0.5') : (on ? 'translate-x-[22px]' : 'translate-x-[2px]')
  return (
    <button type="button" onClick={e => { e.stopPropagation(); onChange(!on) }}
      className={cn('relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none', w, h)}
      style={{ background: on ? accent : '#3a3a3c' }}>
      <span className={cn('inline-block transform rounded-full bg-white shadow-md transition-transform duration-200', knob, tx)} />
    </button>
  )
}

function HueBrightnessSlider({ value, accent, onChange }: { value: number; accent: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Sun className="h-3 w-3 shrink-0 text-zinc-500" />
      <div className="relative flex-1 h-1.5 rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${value}%`, background: accent }} />
        <input type="range" min={1} max={100} value={value}
          onClick={e => e.stopPropagation()}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
      </div>
      <span className="w-8 text-right text-xs text-zinc-400">{value}%</span>
    </div>
  )
}

function MiniHue() {
  const ref = useRef<HTMLDivElement>(null)
  const { h } = useContainerSize(ref)

  const qclient = useQueryClient()
  const { data: rooms } = useQuery<HueRoom[]>({
    queryKey: ['hue', 'rooms'], queryFn: hueApi.getRooms, staleTime: 10_000,
  })
  const [selectedId, setSelectedId] = useLocalStorage<string>('home-hue-room', '')
  const [expanded, setExpanded]     = useState(false)
  const room   = rooms?.find(r => r.id === selectedId) ?? rooms?.[0]
  const accent = room ? roomAccentColor(room) : '#f5a623'
  const onCount = room?.lights.filter(l => l.isOn && l.isReachable).length ?? 0
  const briPct  = room
    ? (() => {
        const on = room.lights.filter(l => l.isOn && l.isReachable)
        return on.length === 0 ? 0 : Math.round(on.reduce((s, l) => s + l.brightness, 0) / on.length / 254 * 100)
      })()
    : 0

  const toggleRoom = useMutation({
    mutationFn: (on: boolean) => hueApi.setGroupAction(room!.id, on),
    onMutate: async (on) => {
      const prev = qclient.getQueryData<HueRoom[]>(['hue', 'rooms'])
      qclient.setQueryData<HueRoom[]>(['hue', 'rooms'], old =>
        old?.map(r => r.id === room?.id
          ? { ...r, anyOn: on, allOn: on, lights: r.lights.map(l => ({ ...l, isOn: on })) }
          : r) ?? [])
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qclient.setQueryData(['hue', 'rooms'], ctx.prev),
  })

  const dimRoom = useMutation({
    mutationFn: async (pct: number) => {
      const bri = Math.round((pct / 100) * 254)
      await Promise.all(room!.lights.filter(l => l.isOn && l.isReachable).map(l => hueApi.setLightState(l.id, { brightness: bri })))
    },
    onMutate: async (pct) => {
      const prev = qclient.getQueryData<HueRoom[]>(['hue', 'rooms'])
      const bri = Math.round((pct / 100) * 254)
      qclient.setQueryData<HueRoom[]>(['hue', 'rooms'], old =>
        old?.map(r => r.id === room?.id
          ? { ...r, lights: r.lights.map(l => l.isOn ? { ...l, brightness: bri } : l) }
          : r) ?? [])
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qclient.setQueryData(['hue', 'rooms'], ctx.prev),
  })

  const toggleLight = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) => hueApi.setLightState(id, { on }),
    onSuccess: () => qclient.invalidateQueries({ queryKey: ['hue', 'rooms'] }),
  })

  const dimLight = useMutation({
    mutationFn: ({ id, pct }: { id: string; pct: number }) =>
      hueApi.setLightState(id, { brightness: Math.round((pct / 100) * 254) }),
    onSuccess: () => qclient.invalidateQueries({ queryKey: ['hue', 'rooms'] }),
  })

  const showLights = h > 280 && expanded

  return (
    <div ref={ref} className="h-full rounded-2xl bg-card2 flex flex-col overflow-hidden">
      {/* Room selector tabs */}
      {rooms && rooms.length > 1 && (
        <div className="flex gap-1 p-3 pb-0 shrink-0 overflow-x-auto">
          {rooms.map(r => (
            <button key={r.id} onClick={() => setSelectedId(r.id)}
              className={cn(
                'rounded-xl px-3 py-1 text-xs font-medium whitespace-nowrap transition-all shrink-0',
                r.id === (room?.id ?? '') ? 'bg-white text-black' : 'bg-elev text-zinc-400 hover:text-zinc-200'
              )}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      {!room ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-600">Geen lampen</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 gap-3 min-h-0 overflow-y-auto">
          {/* Room header: name + toggle */}
          <div className="flex items-center justify-between shrink-0">
            <div>
              <p className="text-sm font-semibold text-fg">{room.name}</p>
              <p className="text-xs text-zinc-500">{onCount}/{room.lights.length} aan</p>
            </div>
            <HueIOSToggle on={room.anyOn} accent={accent} onChange={v => toggleRoom.mutate(v)} />
          </div>

          {/* Room brightness */}
          {room.anyOn && (
            <div className="shrink-0">
              <HueBrightnessSlider value={briPct} accent={accent} onChange={v => dimRoom.mutate(v)} />
            </div>
          )}

          {/* Scene chips */}
          {h > 200 && room.anyOn && <MiniSceneChips roomId={room.id} />}

          {/* Expand/collapse individual lights */}
          {h > 250 && room.lights.length > 0 && (
            <button onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 shrink-0 transition-colors">
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Lampen
            </button>
          )}

          {/* Individual lights */}
          {showLights && (
            <div className="flex flex-col divide-y divide-white/5 shrink-0">
              {room.lights.map(light => (
                <div key={light.id} className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: light.isOn ? accent : '#3a3a3c', boxShadow: light.isOn ? `0 0 4px ${accent}` : 'none' }} />
                    <span className={cn('flex-1 text-xs truncate', light.isOn ? 'text-zinc-200' : 'text-zinc-500')}>{light.name}</span>
                    <HueIOSToggle on={light.isOn} accent={accent} small
                      onChange={on => toggleLight.mutate({ id: light.id, on })} />
                  </div>
                  {light.isOn && (
                    <div className="mt-1.5 pl-3.5">
                      <HueBrightnessSlider
                        value={Math.round((light.brightness / 254) * 100)}
                        accent={accent}
                        onChange={pct => dimLight.mutate({ id: light.id, pct })} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MiniSceneChips({ roomId }: { roomId: string }) {
  const qclient = useQueryClient()
  const { data: scenes } = useQuery<HueScene[]>({
    queryKey: ['hue', 'scenes', roomId],
    queryFn: () => hueApi.getScenes(roomId),
    staleTime: 60_000,
  })
  const activate = useMutation({
    mutationFn: (sceneId: string) => hueApi.activateScene(roomId, sceneId),
    onSuccess: () => setTimeout(() => qclient.invalidateQueries({ queryKey: ['hue', 'rooms'] }), 600),
  })
  if (!scenes || scenes.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 shrink-0">
      {scenes.map(s => (
        <button key={s.id} onClick={() => activate.mutate(s.id)}
          className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400 hover:text-fg hover:border-white/30 transition-colors">
          {s.name}
        </button>
      ))}
    </div>
  )
}

// ── Mini System ─────────────────────────────────────────────────────────────────
function MiniSystem() {
  const ref = useRef<HTMLDivElement>(null)
  const { h, w } = useContainerSize(ref)

  // Layout: wide row / medium 2x2 / narrow column
  const layout: 'row' | 'grid' | 'col' = w >= 480 ? 'row' : w >= 260 ? 'grid' : 'col'
  const gaugeSize = layout === 'row'
    ? (h > 300 ? 'xl' : h > 220 ? 'md' : 'home')
    : (h > 380 ? 'md' : 'home')
  const showNetwork = h > 170

  const { data } = useQuery<SystemStats>({
    queryKey: ['system'], queryFn: systemApi.getStats, refetchInterval: 3_000,
  })

  const showDiskList = h > 350 && !!(data?.disks && data.disks.length > 1)

  const gauges = !data ? null : [
    { label: 'CPU',  value: data.cpuLoad,      color: '#38bdf8', sublabel: data.cpuTemp > 0 ? `${Math.round(data.cpuTemp)}°` : undefined },
    { label: 'GPU',  value: data.gpuLoad,       color: '#818cf8', sublabel: data.gpuTemp > 0 ? `${Math.round(data.gpuTemp)}°` : undefined },
    { label: 'RAM',  value: data.memoryPercent, color: '#38bdf8', sublabel: `${data.memoryUsedGb.toFixed(1)}G` },
    { label: 'Disk', value: data.diskPercent,   color: data.diskPercent > 85 ? '#f87171' : '#38bdf8', sublabel: undefined },
  ]

  return (
    <div ref={ref} className="h-full rounded-2xl bg-card2 p-5 flex flex-col">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Systeem</p>
      {!data || !gauges ? <p className="text-sm text-zinc-600">Laden…</p> : (
        <>
          {layout === 'row' && (
            <div className="flex-1 flex items-center justify-around">
              {gauges.map(g => (
                <ArcGauge key={g.label} size={gaugeSize} label={g.label} value={g.value} color={g.color} sublabel={g.sublabel} />
              ))}
            </div>
          )}

          {layout === 'grid' && (
            <div className="flex-1 grid grid-cols-2 gap-2 items-center justify-items-center">
              {gauges.map(g => (
                <ArcGauge key={g.label} size={gaugeSize} label={g.label} value={g.value} color={g.color} sublabel={g.sublabel} />
              ))}
            </div>
          )}

          {layout === 'col' && (
            <div className="flex-1 flex flex-col justify-around gap-1 text-xs text-zinc-300">
              {gauges.map(g => (
                <div key={g.label} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-zinc-500">{g.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${g.value}%`, background: g.color }} />
                  </div>
                  <span className="w-10 text-right">{Math.round(g.value)}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Per-disk info when space allows */}
          {showDiskList && data.disks.map(disk => (
            <div key={disk.name} className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-6 shrink-0 text-zinc-600">{disk.name.replace(':\\', '')}</span>
              <div className="flex-1 h-1 rounded-full bg-white/10 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full bg-sky-500"
                  style={{ width: `${disk.percent}%` }} />
              </div>
              <span className="text-zinc-500 text-[10px]">{disk.usedGb}/{disk.totalGb} GB</span>
            </div>
          ))}

          {showNetwork && (
            <div className="flex justify-center gap-8 border-t border-white/5 pt-3 text-xs text-zinc-500 mt-2">
              <span className="flex items-center gap-1.5">
                <ArrowDown className="h-3 w-3 text-sky-400" />{formatBps(data.networkDownBps)}
              </span>
              <span className="flex items-center gap-1.5">
                <ArrowUp className="h-3 w-3 text-violet-400" />{formatBps(data.networkUpBps)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Thermostat ring ────────────────────────────────────────────────────────────
const MODE_COLOR: Record<string, string> = {
  cool: '#38bdf8', heat: '#fb923c', fan: '#a1a1aa', dry: '#93c5fd', auto: '#34d399',
}
const MODE_LABEL: Record<string, string> = {
  cool: 'Koelen', heat: 'Verwarmen', fan: 'Ventilatie', dry: 'Droog', auto: 'Auto',
}

function ThermostatRing({ target, mode, isOn }: { target: number; mode: string; isOn: boolean }) {
  const MIN = 16, MAX = 30
  const r = 72, cx = 100, cy = 108
  const C = 2 * Math.PI * r, trk = C * 0.75, gap = C - trk
  const pct = Math.min(Math.max((target - MIN) / (MAX - MIN), 0), 1)
  const fil = trk * pct
  const color = isOn ? (MODE_COLOR[mode] ?? '#38bdf8') : '#27272a'
  const dotAngle = ((135 + pct * 270) * Math.PI) / 180
  const dotX = cx + r * Math.cos(dotAngle), dotY = cy + r * Math.sin(dotAngle)

  return (
    <svg viewBox="0 0 200 215" className="w-full max-w-[190px] mx-auto shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={11} strokeLinecap="round"
        strokeDasharray={`${trk} ${gap}`} transform={`rotate(135 ${cx} ${cy})`} />
      {pct > 0.01 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={11} strokeLinecap="round"
          strokeDasharray={`${fil} ${C - fil}`} transform={`rotate(135 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }} />
      )}
      {isOn && <circle cx={dotX} cy={dotY} r={5} fill="white" />}
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="system-ui">{MODE_LABEL[mode] ?? ''}</text>
      <text x={cx} y={cy + 20} textAnchor="middle" fill={isOn ? 'white' : '#52525b'}
        fontSize="34" fontWeight="bold" fontFamily="system-ui">{target}°</text>
      <text x="24"  y="192" textAnchor="middle" fill="#374151" fontSize="10" fontFamily="system-ui">{MIN}°</text>
      <text x="176" y="192" textAnchor="middle" fill="#374151" fontSize="10" fontFamily="system-ui">{MAX}°</text>
    </svg>
  )
}

// ── Mini Airco ─────────────────────────────────────────────────────────────────
const MODES_LIST = ['cool', 'heat', 'fan', 'dry', 'auto']
const MODES_EMOJI: Record<string, string> = { cool: '❄️', heat: '🔥', fan: '💨', dry: '💧', auto: '♻️' }
const FAN_SPEEDS = [{ id: 0, label: 'Auto' }, { id: 2, label: 'Laag' }, { id: 3, label: 'Midden' }, { id: 4, label: 'Hoog' }, { id: 6, label: 'Turbo' }]

function MiniAircoSetup() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
      <Thermometer className="h-8 w-8 text-zinc-700" />
      <p className="text-xs text-zinc-500 max-w-[160px]">Airco nog niet gekoppeld</p>
      <p className="text-[10px] text-zinc-700 max-w-[160px]">Ga naar het Airco tabblad om in te loggen bij LG</p>
    </div>
  )
}

function MiniAirco() {
  const ref = useRef<HTMLDivElement>(null)
  const { h, w } = useContainerSize(ref)
  const qclient = useQueryClient()
  const { data: devices = [] } = useQuery<AircoDevice[]>({
    queryKey: ['airco', 'devices'], queryFn: aircoApi.getDevices, staleTime: 30_000,
  })
  const [selectedId, setSelectedId] = useLocalStorage<string>('home-ac-device', '')
  const device = devices.find(d => d.deviceId === selectedId) ?? devices[0]

  const inv = () => qclient.invalidateQueries({ queryKey: ['airco', 'devices'] })
  const power   = useMutation({ mutationFn: (on: boolean) => aircoApi.setPower(device!.deviceId, on), onSuccess: inv })
  const setTemp = useMutation({ mutationFn: (t: number)   => aircoApi.setTemperature(device!.deviceId, t), onSuccess: inv })
  const setMode = useMutation({ mutationFn: (m: string)   => aircoApi.setMode(device!.deviceId, m), onSuccess: inv })
  const setFan  = useMutation({ mutationFn: (s: number)   => aircoApi.setFanSpeed(device!.deviceId, s), onSuccess: inv })

  // Responsive breakpoints based on both height and width
  const tiny      = h < 160 || w < 130   // only header + power button
  const compact   = h < 240 || w < 170   // no ring, just temp numbers
  const small     = h < 330              // ring + temp, no modes
  const narrow    = w < 220              // use 3-col mode grid instead of 5-col
  const showModes = !tiny && !compact && !small
  const showFan   = h > 430 && w >= 200

  return (
    <div ref={ref} className="h-full rounded-2xl bg-card2 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Airco</p>
          {device && !tiny && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', device.isOnline ? 'bg-emerald-500' : 'bg-zinc-600')} />
              <p className="text-xs text-zinc-500 truncate max-w-[120px]">{device.name}</p>
            </div>
          )}
        </div>
        {device && (
          <button onClick={() => power.mutate(!device.isOn)} disabled={power.isPending || !device.isOnline}
            className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-40',
              device.isOn ? 'bg-orange-500 text-white shadow-[0_0_14px_rgba(249,115,22,0.5)]' : 'bg-elev text-zinc-500 hover:text-zinc-300')}>
            <Power className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Device selector */}
      {!tiny && devices.length > 1 && (
        <div className="flex gap-1.5 mb-2 shrink-0">
          {devices.map(d => (
            <button key={d.deviceId} onClick={() => setSelectedId(d.deviceId)}
              className={cn('flex-1 rounded-xl px-2 py-1 text-xs font-medium truncate transition-all',
                device?.deviceId === d.deviceId ? 'bg-white text-black' : 'bg-elev text-zinc-400 hover:text-zinc-200')}>
              {d.name}
            </button>
          ))}
        </div>
      )}

      {devices.length === 0 ? (
        <MiniAircoSetup />
      ) : device && (
        <>
          {/* Thermostat ring — hidden in tiny/compact mode */}
          {!tiny && !compact && (
            <ThermostatRing target={device.targetTemperature} mode={device.mode} isOn={device.isOn} />
          )}

          {/* Temp controls */}
          <div className={cn('flex items-center shrink-0', tiny ? 'justify-center gap-2' : compact ? 'justify-between mt-1 mb-2' : 'justify-between mt-1 mb-2')}>
            {/* Current temp — hidden in tiny */}
            {!tiny && (
              <div>
                <p className="text-xs text-zinc-600">Kamer</p>
                <p className={cn('font-semibold text-zinc-300', compact ? 'text-2xl' : 'text-lg')}>
                  {device.currentTemperature > 0 ? `${device.currentTemperature}°` : '–°'}
                </p>
              </div>
            )}
            {/* Target temp +/- controls */}
            <div className="flex items-center gap-2">
              <button onClick={() => setTemp.mutate(device.targetTemperature - 1)}
                disabled={!device.isOn || setTemp.isPending}
                className={cn('flex items-center justify-center rounded-full bg-elev text-zinc-300 hover:bg-elev2 disabled:opacity-30 font-bold',
                  tiny ? 'h-7 w-7 text-base' : 'h-8 w-8 text-lg')}>−</button>
              <div className="text-center">
                {!tiny && <p className="text-xs text-zinc-600">Doel</p>}
                <p className={cn('font-bold text-fg text-center', tiny ? 'text-xl w-8' : 'text-lg w-10')}>{device.targetTemperature}°</p>
              </div>
              <button onClick={() => setTemp.mutate(device.targetTemperature + 1)}
                disabled={!device.isOn || setTemp.isPending}
                className={cn('flex items-center justify-center rounded-full bg-elev text-zinc-300 hover:bg-elev2 disabled:opacity-30 font-bold',
                  tiny ? 'h-7 w-7 text-base' : 'h-8 w-8 text-lg')}>+</button>
            </div>
          </div>

          {/* Mode selector */}
          {showModes && (
            <div className={cn('grid gap-1 mb-2 shrink-0', narrow ? 'grid-cols-3' : 'grid-cols-5')}>
              {MODES_LIST.map(m => (
                <button key={m} onClick={() => setMode.mutate(m)}
                  disabled={!device.isOn || setMode.isPending}
                  className={cn('flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-all disabled:opacity-30',
                    device.mode === m ? 'bg-white text-black' : 'bg-elev text-zinc-400 hover:text-zinc-200')}>
                  <span className="text-sm">{MODES_EMOJI[m]}</span>
                  {!narrow && <span className="leading-none">{MODE_LABEL[m]}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Fan speed */}
          {showFan && (
            <div className="shrink-0">
              <p className="text-xs text-zinc-600 mb-1.5 flex items-center gap-1"><Wind className="h-3 w-3" /> Ventilator</p>
              <div className="grid grid-cols-5 gap-1">
                {FAN_SPEEDS.map(s => (
                  <button key={s.id} onClick={() => setFan.mutate(s.id)}
                    disabled={!device.isOn || setFan.isPending}
                    className={cn('rounded-xl py-1.5 text-xs font-medium transition-all disabled:opacity-30',
                      device.fanSpeed === s.id ? 'bg-white text-black' : 'bg-elev text-zinc-400 hover:text-zinc-200')}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Mini Washer ─────────────────────────────────────────────────────────────────
const WASHER_STATE_LABEL: Record<string, string> = {
  standby:  'Standby',
  running:  'Bezig',
  pause:    'Gepauzeerd',
  rinsing:  'Spoelen',
  spinning: 'Centrifugeren',
  drying:   'Drogen',
  cooling:  'Afkoelen',
  steam:    'Stoomverzachten',
  end:      'Klaar',
  error:    'Fout',
}

const WASHER_DOT_COLOR: Record<string, string> = {
  standby:  '#52525b',
  running:  '#60a5fa',
  pause:    '#fbbf24',
  rinsing:  '#22d3ee',
  spinning: '#a78bfa',
  drying:   '#fb923c',
  cooling:  '#38bdf8',
  steam:    '#2dd4bf',
  end:      '#34d399',
  error:    '#f87171',
}

function MiniWasher() {
  const ref = useRef<HTMLDivElement>(null)
  const { h } = useContainerSize(ref)

  const { data: washers = [] } = useQuery<WasherDevice[]>({
    queryKey: ['washer', 'devices'],
    queryFn: washerApi.getDevices,
    refetchInterval: 30_000,
  })

  const isEmpty   = washers.length === 0
  const compact   = h < 180

  function fmtRemaining(minutes: number) {
    if (minutes <= 0) return null
    const hh = Math.floor(minutes / 60), mm = minutes % 60
    return hh > 0 ? `${hh}u ${mm}m` : `${mm}m`
  }

  return (
    <div ref={ref} className="h-full rounded-2xl bg-card2 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <WashingMachine className="h-3.5 w-3.5 text-zinc-500" />
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Wasmachine</p>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-zinc-600">Geen wasmachine gevonden</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {washers.map(w => {
            const label     = WASHER_STATE_LABEL[w.runState] ?? w.runState
            const dotColor  = WASHER_DOT_COLOR[w.runState]  ?? '#52525b'
            const remaining = fmtRemaining(w.remainingMinutes)
            const isActive  = !['standby', 'end', 'error'].includes(w.runState)

            return (
              <div key={w.deviceId} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: dotColor, boxShadow: isActive ? `0 0 6px ${dotColor}` : 'none' }} />
                    <p className="text-sm font-medium text-fg truncate">{w.name}</p>
                  </div>
                  {!compact && w.cycle && isActive && (
                    <p className="text-xs text-zinc-500 mt-0.5 pl-3">{w.cycle}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold" style={{ color: dotColor }}>{label}</p>
                  {remaining && (
                    <p className="text-xs text-zinc-500 mt-0.5">{remaining}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Widget renderer ────────────────────────────────────────────────────────────
function renderWidget(id: WidgetId) {
  switch (id) {
    case 'weather':  return <MiniWeather />
    case 'music':    return <MiniMusic />
    case 'lighting': return <MiniHue />
    case 'system':   return <MiniSystem />
    case 'airco':    return <MiniAirco />
    case 'washer':   return <MiniWasher />
  }
}

// ── HomeWidget ─────────────────────────────────────────────────────────────────
export function HomeWidget({ editMode }: { editMode: boolean }) {
  const [layout, setLayout] = useLocalStorage<HomeLayout>('home-layout', DEFAULT_LAYOUT)

  const [dragId,  setDragId]  = useState<WidgetId | null>(null)
  const [dragCol, setDragCol] = useState<Column | null>(null)
  const [dropCol, setDropCol] = useState<Column | null>(null)
  const [dropIdx, setDropIdx] = useState<number>(-1)

  const allUsed       = [...layout.left, ...layout.middle, ...layout.right]
  const hiddenWidgets = (Object.keys(WIDGET_META) as WidgetId[]).filter(id => !allUsed.includes(id))

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function startDrag(e: React.DragEvent, id: WidgetId, col: Column) {
    e.dataTransfer.effectAllowed = 'move'
    setDragId(id); setDragCol(col)
  }

  function endDrag() {
    setDragId(null); setDragCol(null); setDropCol(null); setDropIdx(-1)
  }

  function handleDragOver(e: React.DragEvent, col: Column, idx: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropCol(col); setDropIdx(idx)
  }

  function handleDrop(col: Column, idx: number) {
    if (!dragId || !dragCol) return
    setLayout(prev => {
      const n: HomeLayout = {
        left: [...prev.left], middle: [...prev.middle], right: [...prev.right],
        flexMap: { ...prev.flexMap }, spanMap: { ...(prev.spanMap ?? {}) },
        colFlex: { ...prev.colFlex },
      }
      n[dragCol] = n[dragCol].filter(id => id !== dragId)
      let at = dragCol === col && prev[col].indexOf(dragId) < idx ? idx - 1 : idx
      at = Math.max(0, Math.min(at, n[col].length))
      n[col].splice(at, 0, dragId)
      return n
    })
    endDrag()
  }

  function removeWidget(id: WidgetId, col: Column) {
    setLayout(prev => ({ ...prev, [col]: prev[col].filter(w => w !== id) }))
  }

  function addWidget(id: WidgetId, col: Column) {
    setLayout(prev => ({ ...prev, [col]: [...prev[col], id] }))
  }

  function getFlex(id: WidgetId) {
    return layout.flexMap?.[id] ?? WIDGET_META[id].flex
  }

  function adjustFlex(id: WidgetId, delta: number) {
    setLayout(prev => {
      const cur  = prev.flexMap?.[id] ?? WIDGET_META[id].flex
      const next = Math.max(1, Math.min(6, cur + delta))
      return { ...prev, flexMap: { ...prev.flexMap, [id]: next } }
    })
  }

  function getColFlex(col: Column) {
    return layout.colFlex?.[col] ?? (col === 'middle' ? 1.5 : 1)
  }

  function adjustColFlex(col: Column, delta: number) {
    setLayout(prev => {
      const cur  = getColFlex(col)
      const next = Math.max(0.5, Math.min(4, Math.round((cur + delta * 0.5) * 10) / 10))
      return { ...prev, colFlex: { ...prev.colFlex, [col]: next } }
    })
  }

  function getSpan(id: WidgetId): WidgetSpan {
    return layout.spanMap?.[id] ?? 'full'
  }

  function toggleSpan(id: WidgetId) {
    setLayout(prev => ({
      ...prev,
      spanMap: { ...(prev.spanMap ?? {}), [id]: (prev.spanMap?.[id] ?? 'full') === 'full' ? 'half' : 'full' },
    }))
  }

  // Groups the flat widget list into rows; consecutive 'half' widgets are paired side by side.
  function buildRows(widgets: WidgetId[]): { items: WidgetId[]; startIdx: number; rowFlex: number }[] {
    const rows: { items: WidgetId[]; startIdx: number; rowFlex: number }[] = []
    let i = 0
    while (i < widgets.length) {
      const id   = widgets[i]
      const span = getSpan(id)
      if (
        span === 'half' &&
        i + 1 < widgets.length &&
        getSpan(widgets[i + 1]) === 'half'
      ) {
        const id2 = widgets[i + 1]
        rows.push({ items: [id, id2], startIdx: i, rowFlex: Math.max(getFlex(id), getFlex(id2)) })
        i += 2
      } else {
        rows.push({ items: [id], startIdx: i, rowFlex: getFlex(id) })
        i += 1
      }
    }
    return rows
  }

  // ── Column renderer ──────────────────────────────────────────────────────────

  function renderColumn(col: Column, colFlex: number) {
    const widgets = layout[col]
    const rows    = buildRows(widgets)

    // Inline drop-zone line between/around rows
    const DropLine = ({ idx }: { idx: number }) => {
      const isTarget = dropCol === col && dropIdx === idx
      return (
        <div
          className={cn(
            'shrink-0 rounded-full transition-all duration-150',
            isTarget
              ? 'h-10 rounded-2xl border-2 border-dashed border-orange-500 bg-orange-500/5 flex items-center justify-center'
              : 'h-1.5 hover:h-4 hover:bg-white/5 cursor-default',
          )}
          onDragOver={e => { e.preventDefault(); handleDragOver(e, col, idx) }}
          onDrop={e => { e.preventDefault(); handleDrop(col, idx) }}
        >
          {isTarget && <Plus className="h-3.5 w-3.5 text-orange-400" />}
        </div>
      )
    }

    return (
      <div className="flex flex-col min-h-0 min-w-0" style={{ flex: colFlex }}>
        {/* Column width controls */}
        {editMode && (
          <div className="shrink-0 flex items-center justify-center gap-1 rounded-xl bg-black/50 py-1 px-2 mb-3">
            <button onClick={() => adjustColFlex(col, -1)}
              className="text-zinc-400 hover:text-fg transition-colors disabled:opacity-30"
              disabled={getColFlex(col) <= 0.5}>
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-xs text-zinc-400 w-16 text-center">
              {col === 'left' ? 'Links' : col === 'middle' ? 'Midden' : 'Rechts'} ({getColFlex(col).toFixed(1)})
            </span>
            <button onClick={() => adjustColFlex(col, 1)}
              className="text-zinc-400 hover:text-fg transition-colors disabled:opacity-30"
              disabled={getColFlex(col) >= 4}>
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Rows + drop zones */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Drop zone before first row */}
          {editMode && dragId && <DropLine idx={0} />}

          {rows.map(({ items, startIdx, rowFlex }) => (
            <React.Fragment key={startIdx}>
              {/* Gap above row (when not dragging, acts as visual spacing) */}
              {startIdx > 0 && !(editMode && dragId) && <div className="shrink-0 h-3" />}

              {/* Row — may contain 1 or 2 widgets */}
              <div className="flex gap-3 min-h-0" style={{ flex: rowFlex }}>
                {items.map(id => (
                  <div
                    key={id}
                    className={cn('relative min-h-0 min-w-0 flex-1 rounded-2xl', dragId === id && 'opacity-40')}
                  >
                    {renderWidget(id)}

                    {/* Edit overlay */}
                    {editMode && (
                      <div className="absolute inset-0 rounded-2xl pointer-events-none">
                        {/* Grip */}
                        <div
                          draggable
                          onDragStart={e => startDrag(e, id, col)}
                          onDragEnd={endDrag}
                          className="absolute top-2 left-2 cursor-grab active:cursor-grabbing rounded-lg bg-black/70 p-1.5 pointer-events-auto z-10"
                        >
                          <GripVertical className="h-4 w-4 text-zinc-300" />
                        </div>
                        {/* Remove */}
                        <button
                          onClick={() => removeWidget(id, col)}
                          className="absolute top-2 right-2 rounded-lg bg-black/70 p-1.5 text-zinc-400 hover:text-red-400 transition-colors pointer-events-auto z-10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {/* Bottom controls: height + width */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-lg bg-black/70 px-1.5 py-0.5 pointer-events-auto z-10">
                          {/* Height */}
                          <button onClick={() => adjustFlex(id, -1)}
                            className="text-zinc-400 hover:text-fg transition-colors disabled:opacity-30 p-0.5"
                            disabled={getFlex(id) <= 1}>
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs text-zinc-400 w-12 text-center">{WIDGET_META[id].label}</span>
                          <button onClick={() => adjustFlex(id, 1)}
                            className="text-zinc-400 hover:text-fg transition-colors disabled:opacity-30 p-0.5"
                            disabled={getFlex(id) >= 6}>
                            <Plus className="h-3 w-3" />
                          </button>
                          {/* Divider */}
                          <span className="w-px h-3 bg-zinc-700 mx-0.5" />
                          {/* Width toggle */}
                          <button
                            onClick={() => toggleSpan(id)}
                            title={getSpan(id) === 'half' ? 'Volle breedte' : 'Halve breedte'}
                            className="text-zinc-400 hover:text-fg transition-colors p-0.5"
                          >
                            {getSpan(id) === 'half'
                              ? <Square   className="h-3 w-3" />
                              : <Columns2 className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Drop zone after this row */}
              {editMode && dragId && <DropLine idx={startIdx + items.length} />}
            </React.Fragment>
          ))}

          {/* Empty column placeholder */}
          {editMode && widgets.length === 0 && !dragId && (
            <div className="flex-1 rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-700">
              <Plus className="h-6 w-6" />
              <p className="text-xs">Leeg</p>
            </div>
          )}

          {/* Empty drop target when no widgets and dragging */}
          {editMode && widgets.length === 0 && dragId && (
            <div
              className={cn(
                'flex-1 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all',
                dropCol === col ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-800'
              )}
              onDragOver={e => { e.preventDefault(); handleDragOver(e, col, 0) }}
              onDrop={e => { e.preventDefault(); handleDrop(col, 0) }}
            >
              <Plus className="h-4 w-4 text-zinc-700" />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Widget grid */}
      <div className="flex flex-1 gap-3 min-h-0">
        {renderColumn('left',   getColFlex('left'))}
        {renderColumn('middle', getColFlex('middle'))}
        {renderColumn('right',  getColFlex('right'))}
      </div>

      {/* Hidden widgets bar (edit mode only) */}
      {editMode && hiddenWidgets.length > 0 && (
        <div className="shrink-0 rounded-2xl bg-card2 p-4 flex items-center gap-4">
          <p className="text-xs text-zinc-500 shrink-0">Verborgen:</p>
          <div className="flex gap-2 flex-wrap">
            {hiddenWidgets.map(id => (
              <div key={id} className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-400 bg-elev rounded-lg px-2 py-1">{WIDGET_META[id].label}</span>
                <span className="text-xs text-zinc-600">→</span>
                {(['left', 'middle', 'right'] as Column[]).map(col => (
                  <button key={col} onClick={() => addWidget(id, col)}
                    className="rounded-lg bg-card4 border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:border-orange-500 transition-colors">
                    {col === 'left' ? 'Links' : col === 'middle' ? 'Midden' : 'Rechts'}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
