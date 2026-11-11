import * as React from 'react'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { motion, useSpring, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'

// ── Shared motion presets ─────────────────────────────────────────────────────
export const spring      = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } as const
export const softSpring  = { type: 'spring', stiffness: 180, damping: 24 } as const
export const easeOutExpo = [0.16, 1, 0.3, 1] as const

/** Fade-up entrance used for cards/sections; pass `i` for stagger. */
export const fadeUp = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show:   (i: number = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: easeOutExpo, delay: i * 0.045 },
  }),
}

// ── Panel: frosted glass card with entrance animation ─────────────────────────
export const Panel = React.forwardRef<HTMLDivElement, HTMLMotionProps<'div'> & { index?: number }>(
  ({ className, index = 0, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      custom={index}
      className={cn('panel rounded-3xl', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
)
Panel.displayName = 'Panel'

// ── Pressable button with tactile spring feedback ─────────────────────────────
export const Press = React.forwardRef<HTMLButtonElement, HTMLMotionProps<'button'>>(
  ({ className, disabled, ...props }, ref) => (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      transition={spring}
      className={cn('select-none', className)}
      {...props}
    />
  )
)
Press.displayName = 'Press'

// ── AnimatedNumber: springs between values without React re-renders ──────────
export function AnimatedNumber({
  value, decimals = 0, suffix = '', prefix = '', className, format,
}: {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
  format?: (v: number) => string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const mv  = useSpring(value, { stiffness: 80, damping: 18, mass: 0.9 })
  const fmt = useRef(format)
  fmt.current = format

  const render = (v: number) =>
    fmt.current ? fmt.current(v) : `${prefix}${v.toFixed(decimals)}${suffix}`

  useLayoutEffect(() => {
    if (ref.current) ref.current.textContent = render(mv.get())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decimals, suffix, prefix])

  useEffect(() => { mv.set(Number.isFinite(value) ? value : 0) }, [mv, value])
  useEffect(() => mv.on('change', v => {
    if (ref.current) ref.current.textContent = render(v)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [mv, decimals, suffix, prefix])

  return <span ref={ref} className={cn('tabular', className)} />
}

// ── Toggle: iOS-style switch with spring knob and accent glow ─────────────────
export function Toggle({
  on, onChange, accent = '#ff8a4c', size = 'md', disabled,
}: {
  on: boolean
  onChange: (v: boolean) => void
  accent?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}) {
  const dims = size === 'sm'
    ? { w: 38, h: 22, k: 18 }
    : { w: 50, h: 30, k: 26 }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={e => { e.stopPropagation(); onChange(!on) }}
      className="relative inline-flex shrink-0 items-center rounded-full p-[2px] transition-[background-color,box-shadow] duration-300 disabled:opacity-40"
      style={{
        width: dims.w, height: dims.h,
        justifyContent: on ? 'flex-end' : 'flex-start',
        background: on ? accent : 'var(--c-elev2)',
        boxShadow: on ? `0 0 18px -2px ${accent}88, inset 0 1px 0 rgba(255,255,255,.25)` : 'inset 0 1px 2px rgba(0,0,0,.25)',
      }}
    >
      <motion.span
        layout
        transition={spring}
        className="block rounded-full bg-white"
        style={{ width: dims.k, height: dims.k, boxShadow: '0 2px 6px rgba(0,0,0,.3), 0 0 0 .5px rgba(0,0,0,.05)' }}
      />
    </button>
  )
}

// ── Segmented control with sliding pill ───────────────────────────────────────
export function Segmented<T extends string | number>({
  items, value, onChange, layoutId, className, itemClassName, size = 'md',
}: {
  items: { id: T; label: React.ReactNode }[]
  value: T
  onChange: (v: T) => void
  layoutId: string
  className?: string
  itemClassName?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div className={cn('relative flex gap-0.5 rounded-2xl bg-card3 p-1', className)}>
      {items.map(item => {
        const active = item.id === value
        return (
          <button
            key={String(item.id)}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'relative whitespace-nowrap font-medium transition-colors duration-200',
              size === 'sm' ? 'rounded-lg px-3 py-1 text-xs' : 'rounded-xl px-4 py-2 text-sm',
              active ? 'text-zinc-950' : 'text-fg2 hover:text-fg',
              itemClassName,
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={spring}
                className={cn('absolute inset-0 bg-white', size === 'sm' ? 'rounded-lg' : 'rounded-xl')}
                style={{ boxShadow: '0 4px 14px -4px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.6) inset' }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Loading skeleton & empty state ────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: easeOutExpo }}
      className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card3 text-fg3">{icon}</div>
      <p className="text-sm font-medium text-fg2">{title}</p>
      {hint && <p className="max-w-[220px] text-xs text-fg3">{hint}</p>}
    </motion.div>
  )
}

/** Small uppercase section label with optional icon. */
export function Label({ icon, children, className }: { icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5 label-caps', className)}>
      {icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
      <span>{children}</span>
    </div>
  )
}
