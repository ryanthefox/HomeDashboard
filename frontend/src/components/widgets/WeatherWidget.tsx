import type { ReactNode } from 'react'
import { useRef, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  Wind, Droplets, Umbrella, Minus, Plus, Sunrise, Sunset, Flower2, Navigation, Gauge, MapPin, Radar,
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { weatherApi, type WeatherData, type HourlyForecastItem, type DailyForecastItem } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useTheme } from '@/lib/ThemeContext'
import { AnimatedNumber, Panel, Label, Skeleton, EmptyState } from '@/components/ui/motion'
import { WeatherFx, WeatherIllustration, WeatherIcon } from '@/components/weather/WeatherFx'

// ── Helpers ───────────────────────────────────────────────────────────────────
const windDir = (deg: number) => ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'][Math.round(deg / 45) % 8]
const NL_DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

function uvColor(uv: number) {
  if (uv <= 2) return '#4ade80'
  if (uv <= 5) return '#fbbf24'
  if (uv <= 7) return '#f97316'
  if (uv <= 10) return '#ef4444'
  return '#c084fc'
}
function uvLabel(uv: number) {
  if (uv <= 2) return 'Laag'
  if (uv <= 5) return 'Matig'
  if (uv <= 7) return 'Hoog'
  if (uv <= 10) return 'Zeer hoog'
  return 'Extreem'
}
function pollenLabel(grass?: number, tree?: number): string {
  if (grass == null && tree == null) return '—'
  const v = Math.max(grass ?? 0, tree ?? 0)
  if (v < 5) return 'Laag'
  if (v < 30) return 'Matig'
  if (v < 80) return 'Hoog'
  return 'Zeer hoog'
}

// ── Building blocks ───────────────────────────────────────────────────────────
function StatTile({ icon, label, children, i }: { icon: ReactNode; label: string; children: ReactNode; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
      className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-card3 px-2 py-3"
    >
      <div className="text-fg3">{icon}</div>
      <p className="text-center text-sm font-semibold leading-tight text-fg tabular">{children}</p>
      <p className="text-center text-[10px] leading-tight text-fg3">{label}</p>
    </motion.div>
  )
}

function HourlyItem({ item, i, isNow }: { item: HourlyForecastItem; i: number; isNow: boolean }) {
  const hour = new Date(item.time).getHours()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.03 }}
      className={`flex min-w-[52px] flex-col items-center gap-1.5 rounded-2xl py-2 ${isNow ? 'bg-card4' : ''}`}
    >
      <p className="text-[11px] text-fg3 tabular">{isNow ? 'Nu' : `${hour}u`}</p>
      <WeatherIcon icon={item.icon} className="h-5 w-5" />
      <p className="text-sm font-semibold text-fg tabular">{Math.round(item.temperature)}°</p>
      <p className={`text-[10px] tabular ${item.precipitationProbability > 15 ? 'text-sky-400' : 'text-transparent'}`}>
        {item.precipitationProbability}%
      </p>
    </motion.div>
  )
}

/** Week row with a min–max temperature range bar (relative to the whole week). */
function DailyRow({ item, weekMin, weekMax, i }: { item: DailyForecastItem; weekMin: number; weekMax: number; i: number }) {
  const d = new Date(item.date + 'T12:00:00')
  const isToday = new Date().toDateString() === d.toDateString()
  const span = Math.max(weekMax - weekMin, 1)
  const left = ((item.tempMin - weekMin) / span) * 100
  const width = ((item.tempMax - item.tempMin) / span) * 100
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.04 }}
      className="flex items-center gap-3 py-1.5"
    >
      <p className="w-10 text-sm font-medium capitalize text-fg2">{isToday ? 'Nu' : NL_DAYS[d.getDay()]}</p>
      <WeatherIcon icon={item.icon} className="h-5 w-5" />
      <p className="w-9 text-right text-[11px] text-sky-400 tabular">{item.precipitationProbability > 10 ? `${item.precipitationProbability}%` : ''}</p>
      <p className="w-8 text-right text-sm text-fg3 tabular">{Math.round(item.tempMin)}°</p>
      <div className="relative h-1.5 flex-1 rounded-full bg-[var(--c-track)]">
        <motion.div
          className="absolute inset-y-0 rounded-full"
          initial={{ width: 0, left: `${left}%` }}
          animate={{ width: `${Math.max(width, 4)}%`, left: `${left}%` }}
          transition={{ delay: 0.35 + i * 0.04, type: 'spring', stiffness: 80, damping: 18 }}
          style={{ background: 'linear-gradient(90deg, #60a5fa, #fbbf24, #fb7185)' }}
        />
      </div>
      <p className="w-8 text-sm font-semibold text-fg tabular">{Math.round(item.tempMax)}°</p>
    </motion.div>
  )
}

function InfoTile({ icon, label, value, sub, color, i }: { icon: ReactNode; label: string; value: string; sub: string; color?: string; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
      className="flex flex-col gap-1 rounded-2xl bg-card3 p-3">
      <p className="flex items-center gap-1 label-caps">{icon}{label}</p>
      <p className="text-xl font-semibold leading-tight tabular" style={{ color: color ?? 'var(--c-fg)' }}>{value}</p>
      <p className="text-xs text-fg3">{sub}</p>
    </motion.div>
  )
}

// ── Radar: Leaflet + CartoDB tiles + RainViewer precipitation ─────────────────
interface RainViewerData {
  host: string
  radar: { past: Array<{ time: number; path: string }>; nowcast?: Array<{ time: number; path: string }> }
}

function WeatherRadar() {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef  = useRef<L.Map | null>(null)
  const baseRef = useRef<L.TileLayer | null>(null)
  const [frameTimes, setFrameTimes] = useState<number[]>([])
  const [frame, setFrame] = useState(0)

  // Map + precipitation frames (created once)
  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, {
      center: [52.0259, 5.5553], zoom: 7, minZoom: 5, maxZoom: 10,
      zoomControl: false, attributionControl: false,
    })
    mapRef.current = map
    L.circleMarker([52.0259, 5.5553], { radius: 5, color: '#fff', weight: 2, fillColor: '#ff8a4c', fillOpacity: 1 }).addTo(map)

    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)

    let timer: ReturnType<typeof setInterval> | null = null
    let layers: L.TileLayer[] = []
    let cancelled = false

    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(r => r.json() as Promise<RainViewerData>)
      .then(data => {
        if (cancelled) return
        const frames = [...data.radar.past, ...(data.radar.nowcast ?? [])]
        if (frames.length === 0) return
        // Preload every frame once; animate by toggling opacity (no new tile requests per tick)
        layers = frames.map(f => L.tileLayer(`${data.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`,
          { opacity: 0, maxNativeZoom: 6, maxZoom: 10, zIndex: 10 }).addTo(map))
        setFrameTimes(frames.map(f => f.time))

        let idx = frames.length - 1
        const show = (i: number) => {
          layers.forEach((l, j) => l.setOpacity(j === i ? 0.7 : 0))
          setFrame(i)
        }
        show(idx)
        timer = setInterval(() => {
          if (document.hidden) return // don't animate in a background tab
          idx = (idx + 1) % frames.length
          show(idx)
        }, 800)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      ro.disconnect()
      if (timer) clearInterval(timer)
      map.remove()
      mapRef.current = null
      baseRef.current = null
    }
  }, [])

  // Base tiles follow the theme
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    baseRef.current?.remove()
    // Esri Canvas basemaps (no API key needed; CartoDB now requires one)
    baseRef.current = L.tileLayer(
      `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${theme === 'dark' ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`,
      { maxZoom: 16, zIndex: 1 },
    ).addTo(map)
  }, [theme])

  const t = frameTimes[frame]
  return (
    <div className="relative flex-1">
      <div ref={containerRef} className="absolute inset-0" />
      {t && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] rounded-2xl border border-white/10 bg-black/50 px-3 py-2 backdrop-blur-md">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-zinc-200 tabular">
            <span>{new Date(t * 1000).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-zinc-400">{t * 1000 > Date.now() ? 'verwachting' : 'gemeten'}</span>
          </div>
          <div className="flex gap-0.5">
            {frameTimes.map((ft, i) => (
              <span key={ft} className="h-1 flex-1 rounded-full transition-colors duration-300"
                style={{ background: i === frame ? '#ff8a4c' : i < frame ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.15)' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main widget ───────────────────────────────────────────────────────────────
export function WeatherWidget() {
  const { data, isLoading, isError } = useQuery<WeatherData>({
    queryKey: ['weather'], queryFn: weatherApi.getCurrent, staleTime: 10 * 60_000,
  })
  const [colFlex, setColFlex] = useLocalStorage<{ left: number; right: number }>('weather-col-flex', { left: 1, right: 1.6 })

  if (isLoading) {
    return <div className="flex h-full gap-4"><div className="flex-1 space-y-3"><Skeleton className="h-44 rounded-3xl" /><Skeleton className="h-24 rounded-3xl" /><Skeleton className="h-40 rounded-3xl" /></div><Skeleton className="hidden flex-[1.6] rounded-3xl sm:block" /></div>
  }
  if (isError || !data) {
    return <div className="flex h-full"><EmptyState icon={<Radar className="h-5 w-5" />} title="Weerdata niet beschikbaar" hint="Open-Meteo is tijdelijk niet bereikbaar" /></div>
  }

  const weekMin = Math.min(...data.daily.map(d => d.tempMin))
  const weekMax = Math.max(...data.daily.map(d => d.tempMax))
  const uv = data.uvIndex ?? 0

  return (
    <div className="flex h-full gap-4">
      {/* Left column: info */}
      <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto pb-2 scrollbar-hide" style={{ flex: colFlex.left }}>
        <Panel className="relative shrink-0 overflow-hidden">
          <WeatherFx icon={data.icon} isDay={data.isDay} />
          <div className="relative z-10 p-6">
            <p className="flex items-center gap-1 text-xs font-medium text-fg2"><MapPin className="h-3 w-3" />Veenendaal</p>
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-7xl font-semibold leading-none tracking-[-0.06em] text-fg">
                  <AnimatedNumber value={Math.round(data.temperature)} /><span className="font-light text-fg3">°</span>
                </p>
                <p className="mt-2 text-base font-medium text-fg">{data.condition}</p>
                <p className="mt-0.5 text-xs text-fg2 tabular">
                  Voelt als {Math.round(data.feelsLike)}° · ↑{Math.round(data.daily[0]?.tempMax ?? data.temperature)}° ↓{Math.round(data.daily[0]?.tempMin ?? data.temperature)}°
                </p>
              </div>
              <WeatherIllustration icon={data.icon} isDay={data.isDay} className="h-28 w-28" />
            </div>
          </div>
        </Panel>

        <div className="flex shrink-0 gap-2">
          <StatTile i={0} icon={<Droplets className="h-4 w-4 text-sky-400" />} label="Vochtigheid"><AnimatedNumber value={Math.round(data.humidity)} suffix="%" /></StatTile>
          <StatTile i={1} icon={<Navigation className="h-4 w-4" style={{ transform: `rotate(${data.windDirection + 180}deg)` }} />} label={`Wind ${windDir(data.windDirection)}`}>
            <AnimatedNumber value={Math.round(data.windSpeed)} suffix=" km/u" />
          </StatTile>
          <StatTile i={2} icon={<Wind className="h-4 w-4" />} label="Windstoten"><AnimatedNumber value={Math.round(data.windGusts)} suffix=" km/u" /></StatTile>
          <StatTile i={3} icon={<Umbrella className="h-4 w-4" />} label="Neerslag"><AnimatedNumber value={data.precipitation} decimals={1} suffix=" mm" /></StatTile>
        </div>

        {data.hourly.length > 0 && (
          <Panel index={1} className="shrink-0 p-4">
            <Label className="mb-2">Komende uren</Label>
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {data.hourly.map((h, i) => <HourlyItem key={h.time} item={h} i={i} isNow={i === 0} />)}
            </div>
          </Panel>
        )}

        {data.daily.length > 0 && (
          <Panel index={2} className="shrink-0 p-4">
            <Label className="mb-1">Deze week</Label>
            <div className="divide-y divide-subtle">
              {data.daily.map((d, i) => <DailyRow key={d.date} item={d} weekMin={weekMin} weekMax={weekMax} i={i} />)}
            </div>
          </Panel>
        )}

        <Panel index={3} className="shrink-0 p-4">
          <Label className="mb-3">Omgeving</Label>
          <div className="grid grid-cols-2 gap-2">
            <InfoTile i={0} icon={<Gauge className="h-3 w-3" />} label="UV-index" value={String(Math.round(uv))} sub={uvLabel(uv)} color={uvColor(uv)} />
            <InfoTile i={1} icon={<Flower2 className="h-3 w-3" />} label="Pollen" value={pollenLabel(data.grassPollen, data.treePollen)} sub="Gras / boom" />
            <InfoTile i={2} icon={<Sunrise className="h-3 w-3" />} label="Opkomst" value={data.sunriseTime || '—'} sub="Zonsopkomst" color="#fbbf24" />
            <InfoTile i={3} icon={<Sunset className="h-3 w-3" />} label="Ondergang" value={data.sunsetTime || '—'} sub="Zonsondergang" color="#fb923c" />
          </div>
        </Panel>
      </div>

      {/* Right column: radar — hidden on mobile */}
      <Panel index={1} className="hidden min-w-0 flex-col overflow-hidden sm:flex" style={{ flex: colFlex.right }}>
        <div className="flex shrink-0 items-center justify-between px-4 py-3">
          <Label icon={<Radar />}>Neerslagradar</Label>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-fg3">rainviewer.com</p>
            <div className="ml-1 flex items-center gap-0.5 rounded-lg bg-card3 p-0.5">
              <button onClick={() => setColFlex(f => ({ left: Math.min(f.left + 0.2, 3), right: Math.max(f.right - 0.2, 0.6) }))}
                className="rounded-md p-1 text-fg3 transition-colors hover:text-fg" title="Radar kleiner"><Minus className="h-3 w-3" /></button>
              <button onClick={() => setColFlex(f => ({ left: Math.max(f.left - 0.2, 0.4), right: Math.min(f.right + 0.2, 3) }))}
                className="rounded-md p-1 text-fg3 transition-colors hover:text-fg" title="Radar groter"><Plus className="h-3 w-3" /></button>
            </div>
          </div>
        </div>
        <WeatherRadar />
      </Panel>
    </div>
  )
}
