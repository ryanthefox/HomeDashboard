import type { ReactNode } from 'react'
import { useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle,
  Wind, Droplets, Thermometer, Umbrella, Minus, Plus, Sunrise, Sunset, Flower2, Moon,
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { weatherApi, type WeatherData, type HourlyForecastItem, type DailyForecastItem } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// ── Deterministic particle arrays ─────────────────────────────────────────────
const RAIN_P = Array.from({ length: 22 }, (_, i) => ({
  id: i, left: (i * 4.7 + 1) % 97,
  delay: (i * 0.11) % 2.0, dur: 0.55 + (i % 7) * 0.07,
  h: 12 + (i % 4) * 5, op: 0.35 + (i % 3) * 0.15,
}))
const SNOW_P = Array.from({ length: 16 }, (_, i) => ({
  id: i, left: (i * 6.4 + 2) % 95, size: 3 + (i % 3),
  delay: (i * 0.4) % 5, dur: 3.5 + (i % 4) * 0.6,
}))

// ── Animated weather background particles ─────────────────────────────────────
function WeatherParticles({ icon, isDay }: { icon: string; isDay: boolean }) {
  const eff = (!isDay && (icon === 'sun' || icon === 'cloud-sun')) ? 'night' : icon
  if (eff === 'cloud-rain' || eff === 'cloud-drizzle') {
    const thin = eff === 'cloud-drizzle'
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <style>{`@keyframes wrain{0%{transform:translateY(-5%);opacity:0}8%{opacity:1}92%{opacity:1}100%{transform:translateY(108%);opacity:0}}`}</style>
        {RAIN_P.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.left}%`, top: 0,
            width: thin ? 1 : 1.5, height: p.h,
            background: `rgba(147,197,253,${p.op})`, borderRadius: 2, transform: 'rotate(-10deg)',
            animation: `wrain ${p.dur}s ${p.delay}s linear infinite`,
          }} />
        ))}
      </div>
    )
  }
  if (eff === 'snowflake') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <style>{`@keyframes wsnow{0%{transform:translateY(-5%) translateX(0);opacity:0}10%{opacity:.85}90%{opacity:.85}100%{transform:translateY(108%) translateX(18px);opacity:0}}`}</style>
        {SNOW_P.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.left}%`, top: 0,
            width: p.size, height: p.size,
            background: 'rgba(224,242,254,.75)', borderRadius: '50%',
            animation: `wsnow ${p.dur}s ${p.delay}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    )
  }
  if (eff === 'cloud-lightning') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <style>{`@keyframes wflash{0%,100%{opacity:0}3%,7%{opacity:.12}5%{opacity:.06}}`}</style>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,204,21,.15)', animation: 'wflash 4s ease-in-out infinite' }} />
      </div>
    )
  }
  if (eff === 'sun') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '70%', height: '70%', background: 'radial-gradient(circle, rgba(251,191,36,.12) 0%, transparent 70%)' }} />
      </div>
    )
  }
  if (eff === 'night') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(148,163,184,.08) 0%, transparent 70%)' }} />
      </div>
    )
  }
  return null
}

// ── Hero gradient overlay ──────────────────────────────────────────────────────
function heroBg(icon: string, isDay: boolean): string {
  if (!isDay && (icon === 'sun' || icon === 'cloud-sun')) return 'from-slate-950/40 via-transparent to-transparent'
  if (icon === 'sun') return 'from-amber-950/30 via-transparent to-transparent'
  if (icon === 'cloud-sun') return 'from-amber-950/20 via-transparent to-transparent'
  if (icon === 'cloud-rain' || icon === 'cloud-drizzle') return 'from-blue-950/40 via-transparent to-transparent'
  if (icon === 'snowflake') return 'from-blue-950/30 via-transparent to-transparent'
  if (icon === 'cloud-lightning') return 'from-purple-950/40 via-transparent to-transparent'
  return 'from-zinc-900/40 via-transparent to-transparent'
}

// ── Illustrations ─────────────────────────────────────────────────────────────
const CC = '#94a3b8'
const CD = '#64748b'

function MoonIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
      <style>{`@keyframes mtwinkle{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
      {[[25,20,2.5,0],[80,15,1.8,0.5],[100,35,2,1.2],[15,55,1.5,0.8],[95,60,1.8,0.3],[40,12,1.5,1.5]].map(([cx,cy,r,delay],i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="white" style={{ animation: `mtwinkle ${2+delay}s ${delay}s ease-in-out infinite` }} />
      ))}
      <circle cx="70" cy="58" r="30" fill="#c8d5e8" />
      <circle cx="83" cy="45" r="30" fill="var(--c-bg, #1a1a1a)" />
      <circle cx="62" cy="52" r="4" fill="#b0bfd8" opacity=".5" />
      <circle cx="72" cy="68" r="3" fill="#b0bfd8" opacity=".4" />
    </svg>
  )
}

function WeatherIllustration({ icon, isDay }: { icon: string; isDay: boolean }) {
  const eff = (!isDay && (icon === 'sun' || icon === 'cloud-sun')) ? 'moon' : icon
  switch (eff) {
    case 'moon': return <MoonIllustration />
    case 'sun':
      return (
        <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
          <style>{`@keyframes wspin{to{transform:rotate(360deg)}}.wsrays{transform-origin:60px 60px;animation:wspin 14s linear infinite}`}</style>
          <circle cx="60" cy="60" r="52" fill="#fbbf24" opacity=".07" />
          <g className="wsrays">
            {[0,45,90,135,180,225,270,315].map((d,i) => {
              const r = d*Math.PI/180
              return <line key={i} x1={60+Math.cos(r)*31} y1={60+Math.sin(r)*31} x2={60+Math.cos(r)*48} y2={60+Math.sin(r)*48} stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
            })}
          </g>
          <circle cx="60" cy="60" r="24" fill="#fbbf24" />
          <circle cx="52" cy="53" r="8" fill="#fde68a" opacity=".55" />
        </svg>
      )
    case 'cloud-sun':
      return (
        <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
          {[0,60,120,180,240,300].map((d,i)=>{const r=d*Math.PI/180;return <line key={i} x1={82+Math.cos(r)*26} y1={42+Math.sin(r)*26} x2={82+Math.cos(r)*36} y2={42+Math.sin(r)*36} stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round"/>})}
          <circle cx="82" cy="42" r="20" fill="#fbbf24"/><circle cx="74" cy="35" r="7" fill="#fde68a" opacity=".5"/>
          <rect x="8" y="64" width="90" height="22" rx="3" fill={CC}/>
          <circle cx="27" cy="64" r="19" fill={CC}/><circle cx="52" cy="55" r="23" fill={CC}/><circle cx="76" cy="59" r="19" fill={CC}/>
        </svg>
      )
    case 'cloud':
      return (
        <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
          <rect x="8" y="60" width="104" height="24" rx="3" fill={CC}/>
          <circle cx="28" cy="60" r="22" fill={CC}/><circle cx="56" cy="50" r="26" fill={CC}/><circle cx="86" cy="54" r="22" fill={CC}/>
        </svg>
      )
    case 'cloud-drizzle':
    case 'cloud-rain': {
      const drops = eff === 'cloud-rain' ? 6 : 4
      const xs = [20,36,52,68,84,100]
      return (
        <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
          <style>{`@keyframes idrop{0%{opacity:.8;transform:translateY(0)}100%{opacity:0;transform:translateY(18px)}}`}</style>
          <rect x="8" y="48" width="104" height="24" rx="3" fill={CC}/>
          <circle cx="28" cy="48" r="22" fill={CC}/><circle cx="56" cy="38" r="26" fill={CC}/><circle cx="86" cy="43" r="22" fill={CC}/>
          {xs.slice(0,drops).map((x,i)=><line key={i} x1={x} y1={80} x2={x-4} y2={93} stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" style={{animation:`idrop 1.1s ${i*.16}s linear infinite`}}/>)}
        </svg>
      )
    }
    case 'snowflake':
      return (
        <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
          <style>{`@keyframes isnow{0%{opacity:.9;transform:translateY(0)}100%{opacity:0;transform:translateY(16px)}}`}</style>
          <rect x="8" y="48" width="104" height="24" rx="3" fill={CC}/>
          <circle cx="28" cy="48" r="22" fill={CC}/><circle cx="56" cy="38" r="26" fill={CC}/><circle cx="86" cy="43" r="22" fill={CC}/>
          {[22,42,62,82,102].map((x,i)=><circle key={i} cx={x} cy={86} r="3.5" fill="#bae6fd" style={{animation:`isnow 2s ${i*.28}s ease-in infinite`}}/>)}
        </svg>
      )
    case 'cloud-lightning':
      return (
        <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
          <style>{`@keyframes iflash{0%,100%{opacity:1}45%,55%{opacity:.2}}`}</style>
          <rect x="8" y="44" width="104" height="24" rx="3" fill={CD}/>
          <circle cx="28" cy="44" r="22" fill={CD}/><circle cx="56" cy="34" r="26" fill={CD}/><circle cx="86" cy="39" r="22" fill={CD}/>
          <path d="M63,74 L54,94 L63,94 L50,116 L72,91 L62,91 Z" fill="#fbbf24" style={{animation:'iflash 2.4s ease-in-out infinite'}}/>
        </svg>
      )
    case 'cloud-fog':
      return (
        <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
          <rect x="8" y="28" width="104" height="24" rx="3" fill="#71717a" opacity=".7"/>
          <circle cx="28" cy="28" r="22" fill="#71717a" opacity=".7"/><circle cx="56" cy="18" r="26" fill="#71717a" opacity=".7"/><circle cx="86" cy="23" r="22" fill="#71717a" opacity=".7"/>
          <rect x="12" y="66" width="88" height="7" rx="3.5" fill="#71717a" opacity=".55"/>
          <rect x="20" y="80" width="72" height="7" rx="3.5" fill="#71717a" opacity=".42"/>
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
          <rect x="8" y="60" width="104" height="24" rx="3" fill={CC}/>
          <circle cx="28" cy="60" r="22" fill={CC}/><circle cx="56" cy="50" r="26" fill={CC}/><circle cx="86" cy="54" r="22" fill={CC}/>
        </svg>
      )
  }
}

// ── Small icon for hourly forecast ────────────────────────────────────────────
function SmallIcon({ icon }: { icon: string }) {
  const cls = 'h-4 w-4'
  switch (icon) {
    case 'sun':             return <Sun             className={`${cls} text-yellow-400`} />
    case 'moon':            return <Moon            className={`${cls} text-slate-300`} />
    case 'cloud-sun':       return <CloudSun        className={`${cls} text-yellow-300`} />
    case 'cloud':           return <Cloud           className={`${cls} text-zinc-400`} />
    case 'cloud-rain':      return <CloudRain       className={`${cls} text-blue-400`} />
    case 'cloud-drizzle':   return <CloudDrizzle    className={`${cls} text-blue-300`} />
    case 'snowflake':       return <CloudSnow       className={`${cls} text-blue-200`} />
    case 'cloud-lightning': return <CloudLightning  className={`${cls} text-purple-400`} />
    case 'cloud-fog':       return <CloudFog        className={`${cls} text-zinc-400`} />
    default:                return <Cloud           className={`${cls} text-zinc-400`} />
  }
}

// ── Hourly item ───────────────────────────────────────────────────────────────
function HourlyItem({ item }: { item: HourlyForecastItem }) {
  const hour = new Date(item.time).getHours()
  const label = hour === 0 ? 'middernacht' : `${hour}u`
  return (
    <div className="flex min-w-[48px] flex-col items-center gap-1.5">
      <p className="text-xs text-zinc-500">{label}</p>
      <SmallIcon icon={item.icon} />
      <p className="text-sm font-semibold text-fg">{Math.round(item.temperature)}°</p>
      {item.precipitationProbability > 15 && (
        <p className="text-[10px] text-blue-400">{item.precipitationProbability}%</p>
      )}
    </div>
  )
}

// ── Wind direction label ──────────────────────────────────────────────────────
function windDir(deg: number): string {
  const dirs = ['N','NO','O','ZO','Z','ZW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

// ── Compact stat tile (1-row layout) ─────────────────────────────────────────
function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-card3 px-2 py-3">
      <div className="text-zinc-500">{icon}</div>
      <p className="text-sm font-bold text-fg leading-tight text-center">{value}</p>
      <p className="text-[10px] text-zinc-500 text-center leading-tight">{label}</p>
    </div>
  )
}

// ── Daily forecast – compact card ─────────────────────────────────────────────
const NL_DAYS = ['zo','ma','di','wo','do','vr','za']

function DailyCard({ item }: { item: DailyForecastItem }) {
  const d = new Date(item.date + 'T12:00:00')
  const day = NL_DAYS[d.getDay()]
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-card3 px-2 py-3 min-w-0">
      <p className="text-xs font-medium text-zinc-500 capitalize">{day}</p>
      <SmallIcon icon={item.icon} />
      <p className="text-sm font-bold text-fg">{Math.round(item.tempMax)}°</p>
      <p className="text-xs text-zinc-500">{Math.round(item.tempMin)}°</p>
      {item.precipitationProbability > 10 && (
        <p className="text-[10px] text-blue-400">{item.precipitationProbability}%</p>
      )}
    </div>
  )
}

// ── Extra info block (UV, pollen, sunrise/sunset) ─────────────────────────────
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
  const val = Math.max(grass ?? 0, tree ?? 0)
  if (grass == null && tree == null) return '--'
  if (val < 5)  return 'Laag'
  if (val < 30) return 'Matig'
  if (val < 80) return 'Hoog'
  return 'Zeer hoog'
}

function ExtraInfoBlock({ data }: { data: WeatherData }) {
  const uv = data.uvIndex ?? 0
  return (
    <div className="rounded-3xl bg-card p-4 shrink-0">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Omgeving</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1 rounded-2xl bg-card3 p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">UV Index</p>
          <p className="text-xl font-bold leading-tight" style={{ color: uvColor(uv) }}>{Math.round(uv)}</p>
          <p className="text-xs text-zinc-500">{uvLabel(uv)}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl bg-card3 p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide flex items-center gap-1">
            <Flower2 className="h-2.5 w-2.5" />Pollen
          </p>
          <p className="text-xl font-bold text-fg leading-tight">{pollenLabel(data.grassPollen, data.treePollen)}</p>
          <p className="text-xs text-zinc-500">Gras / Boom</p>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl bg-card3 p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide flex items-center gap-1">
            <Sunrise className="h-2.5 w-2.5" />Opkomst
          </p>
          <p className="text-xl font-bold text-amber-400 leading-tight">{data.sunriseTime || '--'}</p>
          <p className="text-xs text-zinc-500">Zonsopkomst</p>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl bg-card3 p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide flex items-center gap-1">
            <Sunset className="h-2.5 w-2.5" />Ondergang
          </p>
          <p className="text-xl font-bold text-orange-400 leading-tight">{data.sunsetTime || '--'}</p>
          <p className="text-xs text-zinc-500">Zonsondergang</p>
        </div>
      </div>
    </div>
  )
}

// ── Radar – Leaflet + CartoDB dark tiles + RainViewer precipitation ────────────
interface RainViewerData {
  host: string
  radar: {
    past: Array<{ time: number; path: string }>
    nowcast?: Array<{ time: number; path: string }>
  }
}

function WeatherRadar() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, {
      center: [52.0259, 5.5553],
      zoom: 7,
      minZoom: 5,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false,
    })
    mapRef.current = map

    // Dark base tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    // Handle container resize
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)

    // RainViewer animated precipitation overlay
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(r => r.json() as Promise<RainViewerData>)
      .then(data => {
        const frames = [...data.radar.past, ...(data.radar.nowcast ?? [])]
        if (frames.length === 0) return

        let idx = frames.length - 1
        let currentLayer: L.TileLayer | null = null

        const showFrame = (i: number) => {
          const next = L.tileLayer(
            `${data.host}${frames[i].path}/256/{z}/{x}/{y}/2/1_1.png`,
            { opacity: 0.65, maxNativeZoom: 6, maxZoom: 10, zIndex: 10 }
          )
          next.addTo(map)
          if (currentLayer) {
            const prev = currentLayer
            setTimeout(() => map.removeLayer(prev), 300)
          }
          currentLayer = next
        }

        showFrame(idx)
        timerRef.current = setInterval(() => {
          idx = (idx + 1) % frames.length
          showFrame(idx)
        }, 700)
      })
      .catch(() => {})

    return () => {
      ro.disconnect()
      if (timerRef.current) clearInterval(timerRef.current)
      map.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="flex-1 w-full" />
}

// ── Main widget ───────────────────────────────────────────────────────────────
export function WeatherWidget() {
  const { data, isLoading, isError } = useQuery<WeatherData>({
    queryKey: ['weather'],
    queryFn: weatherApi.getCurrent,
    staleTime: 10 * 60_000,
  })

  // Column flex ratio: left info panel vs right radar
  const [colFlex, setColFlex] = useLocalStorage<{ left: number; right: number }>(
    'weather-col-flex', { left: 1, right: 1.6 }
  )

  if (isLoading) return <div className="flex h-64 items-center justify-center text-zinc-500">Laden…</div>
  if (isError || !data) return <div className="flex h-64 items-center justify-center text-zinc-500">Weerdata niet beschikbaar</div>

  const isDay = data.isDay

  return (
    <div className="h-full flex gap-4">

      {/* Left column: info */}
      <div className="flex flex-col gap-3 min-h-0 min-w-0 overflow-y-auto scrollbar-hide" style={{ flex: colFlex.left }}>

        {/* Hero card */}
        <div className="relative overflow-hidden rounded-3xl bg-card shrink-0">
          <WeatherParticles icon={data.icon} isDay={isDay} />
          <div className={`absolute inset-0 bg-gradient-to-br ${heroBg(data.icon, isDay)}`} />
          <div className="relative z-10 p-5">
            <p className="mb-0.5 text-xs font-medium text-zinc-400">Veenendaal</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-6xl font-bold tracking-tighter text-fg leading-none">{Math.round(data.temperature)}°</p>
                <p className="mt-1.5 text-base text-zinc-300">{data.condition}</p>
                <p className="mt-0.5 text-xs text-zinc-500">Voelt als {Math.round(data.feelsLike)}°C</p>
              </div>
              <WeatherIllustration icon={data.icon} isDay={isDay} />
            </div>
          </div>
        </div>

        {/* Stats — 4 in a row */}
        <div className="flex gap-2 shrink-0">
          <StatTile icon={<Droplets className="h-3.5 w-3.5" />} label="Vochtigheid" value={`${Math.round(data.humidity)}%`} />
          <StatTile icon={<Wind className="h-3.5 w-3.5" />} label={`Wind ${windDir(data.windDirection)}`} value={`${Math.round(data.windSpeed)} km/u`} />
          <StatTile icon={<Thermometer className="h-3.5 w-3.5" />} label="Windstoten" value={`${Math.round(data.windGusts)} km/u`} />
          <StatTile icon={<Umbrella className="h-3.5 w-3.5" />} label="Neerslag" value={`${data.precipitation.toFixed(1)} mm`} />
        </div>

        {/* Hourly forecast */}
        {data.hourly.length > 0 && (
          <div className="rounded-3xl bg-card p-4 shrink-0">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Per uur</p>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
              {data.hourly.map(h => <HourlyItem key={h.time} item={h} />)}
            </div>
          </div>
        )}

        {/* Weekly forecast — fills full width */}
        {data.daily.length > 0 && (
          <div className="rounded-3xl bg-card p-4 shrink-0">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Deze week</p>
            <div className="flex gap-2">
              {data.daily.map(d => <DailyCard key={d.date} item={d} />)}
            </div>
          </div>
        )}

        {/* Extra info: UV, pollen, sunrise, sunset */}
        <ExtraInfoBlock data={data} />
      </div>

      {/* Right column: radar — hidden on mobile */}
      <div className="hidden sm:flex flex-col overflow-hidden rounded-3xl bg-card" style={{ flex: colFlex.right, minWidth: 0 }}>
        {/* Header with resize controls */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Neerslag radar</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-600">rainviewer.com</p>
            {/* Column ratio controls */}
            <div className="flex items-center gap-0.5 ml-2">
              <button onClick={() => setColFlex(f => ({ left: Math.min(f.left + 0.2, 3), right: Math.max(f.right - 0.2, 0.6) }))}
                className="rounded p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors" title="Radar kleiner">
                <Minus className="h-3 w-3" />
              </button>
              <button onClick={() => setColFlex(f => ({ left: Math.max(f.left - 0.2, 0.4), right: Math.min(f.right + 0.2, 3) }))}
                className="rounded p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors" title="Radar groter">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
        <WeatherRadar />
      </div>

    </div>
  )
}
