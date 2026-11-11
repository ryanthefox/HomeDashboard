import { useId } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { TEMP_MIN, TEMP_MAX, modeColor, modeLabel } from '@/lib/airco'
import { softSpring } from './motion'

/** Thermostat dial: a 270° arc that springs to the target temperature. */
export function ThermostatRing({
  target, current, mode, isOn, className,
}: {
  target: number
  current?: number
  mode: string
  isOn: boolean
  className?: string
}) {
  const id = useId().replace(/:/g, '')
  const r = 80, cx = 100, cy = 100
  const pct = Math.min(Math.max((target - TEMP_MIN) / (TEMP_MAX - TEMP_MIN), 0), 1)
  const color = isOn ? modeColor(mode) : '#52525b'
  const angle = ((135 + pct * 270) * Math.PI) / 180
  const knob = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }

  // tick marks every 1°C
  const ticks = Array.from({ length: TEMP_MAX - TEMP_MIN + 1 }, (_, i) => {
    const a = ((135 + (i / (TEMP_MAX - TEMP_MIN)) * 270) * Math.PI) / 180
    const major = i % 2 === 0
    const r1 = r - 17, r2 = r - (major ? 24 : 21)
    return { x1: cx + r1 * Math.cos(a), y1: cy + r1 * Math.sin(a), x2: cx + r2 * Math.cos(a), y2: cy + r2 * Math.sin(a), lit: i / (TEMP_MAX - TEMP_MIN) <= pct }
  })

  return (
    <div className={cn('relative mx-auto aspect-square w-full', className)} style={{ containerType: 'inline-size' }}>
      {/* Soft coloured aura behind the dial */}
      <motion.div
        className="absolute inset-[12%] rounded-full blur-2xl"
        animate={{ backgroundColor: color, opacity: isOn ? 0.22 : 0.05 }}
        transition={{ duration: 0.8 }}
      />
      <svg viewBox="0 0 200 200" className="relative h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`tg${id}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity=".5" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.lit && isOn ? color : 'var(--c-track)'} strokeOpacity={t.lit && isOn ? 0.7 : 1}
            strokeWidth={1.5} strokeLinecap="round" style={{ transition: 'stroke .5s' }} />
        ))}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--c-track)" strokeWidth={10}
          strokeLinecap="round" strokeDasharray={`${2 * Math.PI * r * 0.75} ${2 * Math.PI * r}`}
          transform={`rotate(135 ${cx} ${cy})`} />
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none" stroke={`url(#tg${id})`} strokeWidth={10} strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0.001, 0.75 * pct), opacity: isOn ? 1 : 0.5 }}
          transition={softSpring}
          style={{ filter: isOn ? `drop-shadow(0 0 8px ${color}88)` : 'none' }}
        />
        <motion.circle
          r={7} fill="white"
          initial={false}
          animate={{ cx: knob.x, cy: knob.y, opacity: isOn ? 1 : 0.4 }}
          transition={softSpring}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      {/* Centre read-out */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p key={mode + isOn} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="label-caps" style={{ color: isOn ? color : undefined }}>
            {isOn ? modeLabel(mode) : 'Uit'}
          </motion.p>
        </AnimatePresence>
        <div className="relative mt-0.5 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={target}
              initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -20, opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={cn('text-[clamp(1.75rem,8cqw,3rem)] font-semibold leading-none tracking-[-0.04em] tabular', isOn ? 'text-fg' : 'text-fg3')}
            >
              {target}°
            </motion.p>
          </AnimatePresence>
        </div>
        {current != null && current > 0 && (
          <p className="mt-1 text-[11px] text-fg3 tabular">Kamer {current}°</p>
        )}
      </div>
    </div>
  )
}
