import { memo } from 'react'
import {
  Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, Moon, CloudMoon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Night variants of day-only icons. */
export function effectiveIcon(icon: string, isDay: boolean): string {
  if (isDay) return icon
  if (icon === 'sun') return 'moon'
  if (icon === 'cloud-sun') return 'cloud-moon'
  return icon
}

/** Subtle sky tint for hero cards, by condition. */
export function skyGradient(icon: string, isDay: boolean): string {
  const eff = effectiveIcon(icon, isDay)
  switch (eff) {
    case 'sun':             return 'linear-gradient(160deg, rgba(255,170,80,.28) 0%, rgba(255,120,60,.10) 45%, transparent 75%)'
    case 'cloud-sun':       return 'linear-gradient(160deg, rgba(255,190,110,.20) 0%, rgba(148,163,184,.10) 50%, transparent 80%)'
    case 'moon':
    case 'cloud-moon':      return 'linear-gradient(160deg, rgba(99,102,241,.22) 0%, rgba(30,41,59,.18) 50%, transparent 85%)'
    case 'cloud-rain':
    case 'cloud-drizzle':   return 'linear-gradient(160deg, rgba(59,130,246,.22) 0%, rgba(30,58,138,.12) 55%, transparent 85%)'
    case 'snowflake':       return 'linear-gradient(160deg, rgba(186,230,253,.22) 0%, rgba(148,163,184,.10) 55%, transparent 85%)'
    case 'cloud-lightning': return 'linear-gradient(160deg, rgba(139,92,246,.26) 0%, rgba(30,27,75,.18) 55%, transparent 85%)'
    case 'cloud-fog':       return 'linear-gradient(160deg, rgba(161,161,170,.18) 0%, transparent 80%)'
    default:                return 'linear-gradient(160deg, rgba(148,163,184,.16) 0%, transparent 80%)'
  }
}

// ── Small coloured icon (forecast rows) ───────────────────────────────────────
export function WeatherIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = cn('h-4 w-4', className)
  switch (icon) {
    case 'sun':             return <Sun            className={cn(cls, 'text-amber-400')} />
    case 'moon':            return <Moon           className={cn(cls, 'text-indigo-200')} />
    case 'cloud-moon':      return <CloudMoon      className={cn(cls, 'text-indigo-200')} />
    case 'cloud-sun':       return <CloudSun       className={cn(cls, 'text-amber-300')} />
    case 'cloud-rain':      return <CloudRain      className={cn(cls, 'text-sky-400')} />
    case 'cloud-drizzle':   return <CloudDrizzle   className={cn(cls, 'text-sky-300')} />
    case 'snowflake':       return <CloudSnow      className={cn(cls, 'text-sky-100')} />
    case 'cloud-lightning': return <CloudLightning className={cn(cls, 'text-violet-400')} />
    case 'cloud-fog':       return <CloudFog       className={cn(cls, 'text-zinc-400')} />
    default:                return <Cloud          className={cn(cls, 'text-zinc-400')} />
  }
}

// ── Deterministic particle arrays ─────────────────────────────────────────────
const RAIN = Array.from({ length: 26 }, (_, i) => ({
  id: i, left: (i * 3.9 + 1) % 98, delay: (i * 0.13) % 2.0, dur: 0.55 + (i % 7) * 0.07,
  h: 12 + (i % 4) * 6, op: 0.25 + (i % 3) * 0.15,
}))
const SNOW = Array.from({ length: 20 }, (_, i) => ({
  id: i, left: (i * 5.1 + 2) % 96, size: 2.5 + (i % 3) * 1.2, delay: (i * 0.45) % 6, dur: 4 + (i % 4) * 0.8,
}))
const STARS = Array.from({ length: 18 }, (_, i) => ({
  id: i, left: (i * 17.3 + 5) % 95, top: (i * 11.7 + 3) % 70, size: 1 + (i % 3) * 0.6, delay: (i * 0.37) % 4,
}))

function CloudShape({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 120 55" fill="currentColor" aria-hidden>
      <rect x="5" y="28" width="110" height="22" rx="11" />
      <circle cx="28" cy="30" r="18" /><circle cx="56" cy="22" r="24" /><circle cx="86" cy="28" r="18" />
    </svg>
  )
}

/**
 * Ambient weather effects layered behind card content.
 * `density="low"` is used for small tiles.
 */
export const WeatherFx = memo(function WeatherFx({ icon, isDay, density = 'high' }: {
  icon: string; isDay: boolean; density?: 'low' | 'high'
}) {
  const eff = effectiveIcon(icon, isDay)
  const n = (arr: unknown[]) => (density === 'low' ? Math.ceil(arr.length / 2) : arr.length)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden
      style={{ containerType: 'size', ['--fall' as string]: '112cqh' }}>
      <div className="absolute inset-0" style={{ background: skyGradient(icon, isDay) }} />

      {(eff === 'sun' || eff === 'cloud-sun') && (
        <>
          <div className="absolute -right-[15%] -top-[35%] h-[85%] w-[70%] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,190,90,.35) 0%, transparent 65%)', animation: 'wpulse 6s ease-in-out infinite' }} />
          <svg className="absolute -right-[10%] -top-[18%] w-[52%] opacity-25" viewBox="0 0 120 120">
            <g style={{ transformOrigin: '60px 60px', animation: 'wspin 40s linear infinite' }}>
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * 30 * Math.PI) / 180
                return <line key={i} x1={60 + Math.cos(a) * 32} y1={60 + Math.sin(a) * 32} x2={60 + Math.cos(a) * 52} y2={60 + Math.sin(a) * 52}
                  stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
              })}
            </g>
          </svg>
        </>
      )}

      {(eff === 'moon' || eff === 'cloud-moon') && (
        <>
          <div className="absolute -right-[10%] -top-[25%] h-[70%] w-[55%] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(165,180,252,.22) 0%, transparent 65%)' }} />
          {STARS.slice(0, n(STARS)).map(s => (
            <span key={s.id} className="absolute rounded-full bg-white"
              style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animation: `twinkle ${2.5 + s.delay}s ${s.delay}s ease-in-out infinite` }} />
          ))}
        </>
      )}

      {(eff === 'cloud' || eff === 'cloud-sun' || eff === 'cloud-moon' || eff === 'cloud-fog') && (
        <>
          <CloudShape className="absolute -right-[8%] top-[2%] w-[65%] text-slate-300"
            style={{ opacity: 0.045, animation: 'wdrift 14s ease-in-out infinite' }} />
          <CloudShape className="absolute -left-[6%] bottom-[8%] w-[48%] text-slate-300"
            style={{ opacity: 0.03, animation: 'wdrift 18s -4s ease-in-out infinite reverse' }} />
        </>
      )}

      {(eff === 'cloud-rain' || eff === 'cloud-drizzle') && RAIN.slice(0, n(RAIN)).map(p => (
        <span key={p.id} className="absolute top-0 rounded-full"
          style={{
            left: `${p.left}%`, width: eff === 'cloud-drizzle' ? 1 : 1.5, height: p.h,
            background: `linear-gradient(to bottom, transparent, rgba(147,197,253,${p.op + 0.25}))`,
            transform: 'rotate(-12deg)', animation: `wrain ${p.dur}s ${p.delay}s linear infinite`,
          }} />
      ))}

      {eff === 'snowflake' && SNOW.slice(0, n(SNOW)).map(p => (
        <span key={p.id} className="absolute top-0 rounded-full"
          style={{
            left: `${p.left}%`, width: p.size, height: p.size, background: 'rgba(240,249,255,.85)',
            boxShadow: '0 0 6px rgba(255,255,255,.6)', animation: `wsnow ${p.dur}s ${p.delay}s ease-in-out infinite`,
          }} />
      ))}

      {eff === 'cloud-lightning' && (
        <div className="absolute inset-0" style={{ background: 'rgba(196,181,253,.25)', animation: 'wflash 5s ease-in-out infinite' }} />
      )}
    </div>
  )
})

// ── Large animated illustration for hero cards ───────────────────────────────
const CC = '#cbd5e1'
const CD = '#94a3b8'

export function WeatherIllustration({ icon, isDay, className }: { icon: string; isDay: boolean; className?: string }) {
  const eff = effectiveIcon(icon, isDay)
  const cls = cn('h-24 w-24 drop-shadow-[0_10px_25px_rgba(0,0,0,.35)]', className)
  const float = { animation: 'wfloat 6s ease-in-out infinite' }

  const cloud = (y: number, fill = CC, op = 1) => (
    <g opacity={op}>
      <rect x="10" y={y} width="100" height="26" rx="13" fill={fill} />
      <circle cx="32" cy={y + 2} r="20" fill={fill} /><circle cx="60" cy={y - 8} r="26" fill={fill} /><circle cx="88" cy={y} r="19" fill={fill} />
    </g>
  )

  switch (eff) {
    case 'moon':
    case 'cloud-moon':
      return (
        <svg viewBox="0 0 120 120" className={cls} style={float} aria-hidden>
          <defs>
            <radialGradient id="moonG" cx="40%" cy="35%"><stop offset="0%" stopColor="#f1f5ff" /><stop offset="100%" stopColor="#a5b4fc" /></radialGradient>
            <mask id="moonM"><rect width="120" height="120" fill="white" /><circle cx="84" cy="40" r="28" fill="black" /></mask>
          </defs>
          <circle cx="66" cy="54" r="30" fill="url(#moonG)" mask="url(#moonM)" />
          {[[22, 22, 1.8], [96, 18, 1.4], [104, 70, 1.6], [16, 64, 1.2]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="white" style={{ animation: `twinkle ${2 + i * 0.6}s ${i * 0.4}s ease-in-out infinite` }} />
          ))}
          {eff === 'cloud-moon' && cloud(82, CD, 0.95)}
        </svg>
      )
    case 'sun':
      return (
        <svg viewBox="0 0 120 120" className={cls} aria-hidden>
          <defs><radialGradient id="sunG" cx="40%" cy="35%"><stop offset="0%" stopColor="#fff3c4" /><stop offset="60%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#f59e0b" /></radialGradient></defs>
          <circle cx="60" cy="60" r="50" fill="#fbbf24" opacity=".08" style={{ animation: 'wpulse 4s ease-in-out infinite' }} />
          <g style={{ transformOrigin: '60px 60px', animation: 'wspin 24s linear infinite' }}>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * 45 * Math.PI) / 180
              return <line key={i} x1={60 + Math.cos(a) * 32} y1={60 + Math.sin(a) * 32} x2={60 + Math.cos(a) * 46} y2={60 + Math.sin(a) * 46}
                stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
            })}
          </g>
          <circle cx="60" cy="60" r="24" fill="url(#sunG)" />
        </svg>
      )
    case 'cloud-sun':
      return (
        <svg viewBox="0 0 120 120" className={cls} style={float} aria-hidden>
          <defs><radialGradient id="sunG2" cx="40%" cy="35%"><stop offset="0%" stopColor="#fff3c4" /><stop offset="100%" stopColor="#fbbf24" /></radialGradient></defs>
          <g style={{ transformOrigin: '80px 42px', animation: 'wspin 30s linear infinite' }}>
            {Array.from({ length: 6 }, (_, i) => {
              const a = (i * 60 * Math.PI) / 180
              return <line key={i} x1={80 + Math.cos(a) * 25} y1={42 + Math.sin(a) * 25} x2={80 + Math.cos(a) * 34} y2={42 + Math.sin(a) * 34}
                stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
            })}
          </g>
          <circle cx="80" cy="42" r="19" fill="url(#sunG2)" />
          {cloud(70)}
        </svg>
      )
    case 'cloud-drizzle':
    case 'cloud-rain': {
      const xs = eff === 'cloud-rain' ? [26, 42, 58, 74, 90] : [34, 56, 78]
      return (
        <svg viewBox="0 0 120 120" className={cls} aria-hidden>
          <g style={float}>{cloud(50)}</g>
          {xs.map((x, i) => (
            <line key={i} x1={x} y1={84} x2={x - 4} y2={96} stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"
              style={{ animation: `idrop 1.1s ${i * 0.17}s linear infinite` }} />
          ))}
        </svg>
      )
    }
    case 'snowflake':
      return (
        <svg viewBox="0 0 120 120" className={cls} aria-hidden>
          <g style={float}>{cloud(48)}</g>
          {[26, 44, 62, 80, 98].map((x, i) => (
            <circle key={i} cx={x} cy={88} r="3.5" fill="#e0f2fe" style={{ animation: `idrop 2.2s ${i * 0.3}s ease-in infinite` }} />
          ))}
        </svg>
      )
    case 'cloud-lightning':
      return (
        <svg viewBox="0 0 120 120" className={cls} aria-hidden>
          <g style={float}>{cloud(44, CD)}</g>
          <path d="M64,72 L54,94 L64,94 L52,116 L76,88 L65,88 Z" fill="#facc15"
            style={{ animation: 'iflash 2.6s ease-in-out infinite', filter: 'drop-shadow(0 0 8px #facc15)' }} />
        </svg>
      )
    case 'cloud-fog':
      return (
        <svg viewBox="0 0 120 120" className={cls} aria-hidden>
          <g style={float}>{cloud(34, '#a1a1aa', 0.8)}</g>
          <rect x="16" y="72" width="88" height="7" rx="3.5" fill="#a1a1aa" opacity=".5" style={{ animation: 'wdrift 6s ease-in-out infinite' }} />
          <rect x="26" y="86" width="70" height="7" rx="3.5" fill="#a1a1aa" opacity=".35" style={{ animation: 'wdrift 7s -2s ease-in-out infinite reverse' }} />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 120 120" className={cls} style={float} aria-hidden>
          {cloud(62)}
        </svg>
      )
  }
}
