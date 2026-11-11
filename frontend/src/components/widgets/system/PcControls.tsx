import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Loader2, Moon, Power, PowerOff, RotateCcw, Server, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PcPowerCommand, PcStatus } from '@/lib/api'
import { usePcActions, type SystemSource } from '@/lib/pc'
import { spring } from '@/components/ui/motion'

/** Compact Server / PC switch. */
export function SourceToggle({ value, onChange, pcName, size = 'sm' }: {
  value: SystemSource; onChange: (v: SystemSource) => void; pcName: string; size?: 'xs' | 'sm'
}) {
  const items: { id: SystemSource; label: string; icon: React.ReactNode }[] = [
    { id: 'server', label: 'Server', icon: <Server /> },
    { id: 'pc',     label: pcName,   icon: <Monitor /> },
  ]
  return (
    <div className="relative flex gap-0.5 rounded-xl bg-card3 p-0.5" onClick={e => e.stopPropagation()}>
      {items.map(item => {
        const active = item.id === value
        return (
          <button key={item.id} type="button" onClick={() => onChange(item.id)} title={item.label}
            className={cn('relative flex items-center gap-1 whitespace-nowrap rounded-lg font-medium transition-colors',
              size === 'xs' ? 'px-2 py-0.5 text-[10px] [&_svg]:h-3 [&_svg]:w-3' : 'px-2.5 py-1 text-xs [&_svg]:h-3.5 [&_svg]:w-3.5',
              active ? 'text-zinc-950' : 'text-fg2 hover:text-fg')}>
            {active && <motion.span layoutId={`sys-src-${size}`} transition={spring} className="absolute inset-0 rounded-lg bg-white" />}
            <span className="relative z-10 flex items-center gap-1">{item.icon}{size === 'sm' && item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

const POWER_ITEMS: { cmd: PcPowerCommand; label: string; confirm: string; icon: React.ReactNode; danger?: boolean }[] = [
  { cmd: 'sleep',    label: 'Slaapstand', confirm: 'Zeker? Slaapstand', icon: <Moon /> },
  { cmd: 'restart',  label: 'Herstarten', confirm: 'Zeker? Herstarten', icon: <RotateCcw /> },
  { cmd: 'shutdown', label: 'Afsluiten',  confirm: 'Zeker? Afsluiten',  icon: <PowerOff />, danger: true },
]

/**
 * Power button for the PC: wakes it when off; when on, opens a small menu where every
 * action needs a second tap to confirm (no browser dialogs).
 */
export function PcPowerButton({ pc, compact }: { pc: PcStatus; compact?: boolean }) {
  const { wake, power } = usePcActions()
  const [open, setOpen]     = useState(false)
  const [armed, setArmed]   = useState<PcPowerCommand | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click; disarm a pending confirmation after a few seconds
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) { setOpen(false); setArmed(null) } }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(null), 4000)
    return () => clearTimeout(t)
  }, [armed])

  const busy = pc.state === 'waking' || pc.state === 'stopping' || wake.isPending || power.isPending
  const btn  = cn('flex items-center gap-1.5 rounded-xl font-semibold transition-colors disabled:opacity-60',
    compact ? 'h-7 px-2 text-[11px] [&_svg]:h-3.5 [&_svg]:w-3.5' : 'h-9 px-3 text-xs [&_svg]:h-4 [&_svg]:w-4')

  if (pc.state === 'offline' || pc.state === 'waking') {
    if (!pc.canWake) return null
    const waking = pc.state === 'waking' || wake.isPending
    return (
      <button type="button" disabled={waking} onClick={e => { e.stopPropagation(); wake.mutate() }}
        className={cn(btn, 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25')}>
        {waking ? <Loader2 className="animate-spin" /> : <Power />}
        {waking ? 'Opstarten…' : (compact ? 'Aan' : `${pc.name} aanzetten`)}
      </button>
    )
  }

  if (!pc.hasAgent) return null

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button type="button" disabled={busy} onClick={() => { setOpen(o => !o); setArmed(null) }}
        title={`${pc.name} uitzetten`}
        className={cn(btn, open ? 'bg-card4 text-fg' : 'bg-card3 text-fg2 hover:text-fg')}>
        {pc.state === 'stopping' || power.isPending ? <Loader2 className="animate-spin" /> : <Power />}
        {!compact && (pc.state === 'stopping' ? 'Bezig…' : 'Aan/uit')}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-2xl border border-subtle2 bg-card2 p-1 shadow-2xl">
            {POWER_ITEMS.map(item => {
              const isArmed = armed === item.cmd
              return (
                <button key={item.cmd} type="button"
                  onClick={() => {
                    if (!isArmed) { setArmed(item.cmd); return }
                    power.mutate(item.cmd); setOpen(false); setArmed(null)
                  }}
                  className={cn('flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors [&_svg]:h-3.5 [&_svg]:w-3.5',
                    isArmed
                      ? (item.danger ? 'bg-red-500 text-white' : 'bg-amber-400 text-zinc-950')
                      : 'text-fg2 hover:bg-card3 hover:text-fg')}>
                  {item.icon}{isArmed ? item.confirm : item.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Banner shown when the PC is the preferred source but isn't online. */
export function PcOfflineNote({ pc, compact }: { pc: PcStatus; compact?: boolean }) {
  const text = pc.state === 'waking' ? `${pc.name} wordt opgestart…`
    : pc.state === 'stopping' ? `${pc.name} wordt uitgezet…`
    : `${pc.name} staat uit — je ziet de server`
  return (
    <div className={cn('flex items-center gap-2 rounded-xl bg-card3 text-fg3', compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-2 text-xs')}>
      {pc.state === 'waking' || pc.state === 'stopping'
        ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
        : <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fg3" />}
      <span className="truncate">{text}</span>
    </div>
  )
}
