import { useEffect, useId, useRef } from 'react'
import { useSpring } from 'motion/react'

interface ArcGaugeProps {
  value: number
  max?: number
  label: string
  sublabel?: string
  color?: string
  size?: 'sm' | 'home' | 'md' | 'xl'
}

// ly/vy/sy = y-offsets from cy for label / value / sublabel
const SIZES = {
  sm:   { vb: '0 0 70 70',   r: 26, cx: 35, cy: 38, sw: 5,  fl: 7,  fv: 11, fs: 6,   ly: -6,  vy: 8,  sy: 18, cls: 'w-[70px] h-[70px]' },
  home: { vb: '0 0 90 90',   r: 33, cx: 45, cy: 50, sw: 6,  fl: 8,  fv: 14, fs: 7.5, ly: -8,  vy: 8,  sy: 20, cls: 'w-[90px] h-[90px]' },
  md:   { vb: '0 0 100 100', r: 38, cx: 50, cy: 54, sw: 7,  fl: 9,  fv: 17, fs: 8.5, ly: -9,  vy: 9,  sy: 22, cls: 'w-32 h-32' },
  xl:   { vb: '0 0 160 160', r: 60, cx: 80, cy: 87, sw: 10, fl: 13, fv: 30, fs: 12,  ly: -18, vy: 10, sy: 32, cls: 'w-40 h-40' },
}

export function ArcGauge({ value, max = 100, label, sublabel, color = '#38bdf8', size = 'md' }: ArcGaugeProps) {
  const s   = SIZES[size]
  const id  = useId().replace(/:/g, '')
  const C   = 2 * Math.PI * s.r
  const trk = C * 0.75
  const gap = C - trk
  const pct = Math.min(Math.max(value / max, 0), 1)

  // Spring-animate the arc length and the number together
  const arcRef = useRef<SVGCircleElement>(null)
  const numRef = useRef<SVGTSpanElement>(null)
  const mv = useSpring(0, { stiffness: 60, damping: 16, mass: 0.9 })

  useEffect(() => { mv.set(pct) }, [mv, pct])
  useEffect(() => mv.on('change', p => {
    const fil = Math.max(trk * p, 0.001)
    arcRef.current?.setAttribute('stroke-dasharray', `${fil} ${C - fil}`)
    arcRef.current?.setAttribute('opacity', p > 0.005 ? '1' : '0')
    if (numRef.current) numRef.current.textContent = String(Math.round(p * max))
  }), [mv, trk, C, max])

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={s.vb} className={s.cls}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id={`f${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={s.sw * 0.6} />
          </filter>
        </defs>
        {/* track */}
        <circle cx={s.cx} cy={s.cy} r={s.r}
          fill="none" stroke="var(--c-track)" strokeWidth={s.sw} strokeLinecap="round"
          strokeDasharray={`${trk} ${gap}`}
          transform={`rotate(135 ${s.cx} ${s.cy})`}
        />
        {/* soft glow underneath the arc */}
        <circle cx={s.cx} cy={s.cy} r={s.r}
          fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={s.sw} strokeLinecap="round"
          strokeDasharray={`${trk * pct} ${C}`}
          transform={`rotate(135 ${s.cx} ${s.cy})`}
          filter={`url(#f${id})`}
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(.16,1,.3,1)' }}
        />
        {/* value arc */}
        <circle ref={arcRef} cx={s.cx} cy={s.cy} r={s.r}
          fill="none" stroke={`url(#g${id})`} strokeWidth={s.sw} strokeLinecap="round"
          strokeDasharray={`0.001 ${C}`} opacity={0}
          transform={`rotate(135 ${s.cx} ${s.cy})`}
        />
        <text x={s.cx} y={s.cy + s.ly} textAnchor="middle"
          fill="var(--c-fg3)" fontSize={s.fl} fontWeight={600} letterSpacing="0.08em"
          style={{ textTransform: 'uppercase' }}>{label}</text>
        <text x={s.cx} y={s.cy + s.vy} textAnchor="middle"
          fill="var(--c-fg)" fontSize={s.fv} fontWeight={700} letterSpacing="-0.02em"
          style={{ fontVariantNumeric: 'tabular-nums' }}>
          <tspan ref={numRef}>0</tspan><tspan fontSize={s.fv * 0.5} fill="var(--c-fg2)" dx="1">%</tspan>
        </text>
        {sublabel && (
          <text x={s.cx} y={s.cy + s.sy} textAnchor="middle"
            fill="var(--c-fg3)" fontSize={s.fs}>{sublabel}</text>
        )}
      </svg>
    </div>
  )
}
