import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { BellRing, BatteryMedium, Link2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ringApi } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useRingStatus, useRingEventTick, eventLabel, timeAgo } from '@/lib/ring'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState, Skeleton, spring } from '@/components/ui/motion'
import { RingLogin } from '../ring/RingLogin'
import { RingDetail, RingSnapshot } from '../ring/RingDetail'
import { TileHeader } from './shared'
import { RING_VISIBLE_KEY, pickVisible } from './TileConfig'

const SNAPSHOT_REFRESH_MS = 60_000

export function MiniRing() {
  const qc = useQueryClient()
  const { data: status, isLoading } = useRingStatus()
  const [visible] = useLocalStorage<string[]>(RING_VISIBLE_KEY, [])
  const cams = pickVisible(status?.cameras, visible, c => c.id)
  const [selectedId, setSelectedId] = useLocalStorage<string>('home-ring-camera', '')
  const camera = cams.find(c => c.id === selectedId) ?? cams[0]
  const [loginOpen, setLoginOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  // Fresh snapshot every minute and right after a ding/motion
  const liveTick = useRingEventTick(camera?.id)
  const [clock, setClock] = useState(0)
  useEffect(() => { const t = setInterval(() => setClock(c => c + 1), SNAPSHOT_REFRESH_MS); return () => clearInterval(t) }, [])
  const tick = liveTick * 100_000 + clock

  const logout = async () => {
    await ringApi.logout().catch(() => {})
    setDetailOpen(false)
    await qc.invalidateQueries({ queryKey: ['ring'] })
  }

  return (
    <div className="flex h-full flex-col p-4">
      <TileHeader icon={<BellRing />} title={cams.length === 1 && camera ? camera.name : 'Deurbel'}
        right={camera?.hasBattery && camera.batteryLevel != null && (
          <span className={cn('flex items-center gap-1 text-[11px] tabular', camera.batteryLevel < 20 ? 'text-red-400' : 'text-fg3')}>
            <BatteryMedium className="h-3.5 w-3.5" />{camera.batteryLevel}%
          </span>
        )} />

      {isLoading ? (
        <Skeleton className="flex-1 rounded-2xl" />
      ) : !status || status.bridgeDown ? (
        <EmptyState icon={<BellRing className="h-5 w-5" />} title="Ring-koppeling draait niet" hint="Start de ring-container (docker compose up -d)" />
      ) : status.needsLogin ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-fg2">{status.error ?? 'Koppel je Ring-account om je deurbel hier te zien.'}</p>
          <button onClick={() => setLoginOpen(true)} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold">
            <Link2 className="h-4 w-4" /> Ring koppelen
          </button>
        </div>
      ) : !camera ? (
        <EmptyState icon={<BellRing className="h-5 w-5" />} title="Geen camera's gevonden" />
      ) : (
        <>
          {cams.length > 1 && (
            <div className="mb-2 flex shrink-0 gap-1 overflow-x-auto rounded-xl bg-card3 p-0.5 scrollbar-hide">
              {cams.map(c => {
                const active = c.id === camera.id
                return (
                  <button key={c.id} onClick={() => setSelectedId(c.id)}
                    className={cn('relative flex-1 shrink-0 truncate rounded-lg px-2 py-1 text-xs font-medium transition-colors', active ? 'text-zinc-950' : 'text-fg2 hover:text-fg')}>
                    {active && <motion.span layoutId="mini-ring-cam" transition={spring} className="absolute inset-0 rounded-lg bg-white" />}
                    <span className="relative z-10">{c.name}</span>
                  </button>
                )
              })}
            </div>
          )}

          <button onClick={() => setDetailOpen(true)} className="group relative min-h-0 flex-1 overflow-hidden rounded-2xl text-left">
            <RingSnapshot camera={camera} tick={tick} className="absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent p-2.5 pt-8 text-white">
              <span className="min-w-0 truncate text-xs">
                {camera.lastEvent ? <>{eventLabel(camera.lastEvent.kind)} · {timeAgo(camera.lastEvent.at)}</> : camera.isOffline ? 'Offline' : 'Laatste snapshot'}
              </span>
              <Maximize2 className="h-3.5 w-3.5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
            </div>
          </button>
        </>
      )}

      <Dialog open={loginOpen} onClose={() => setLoginOpen(false)} title="Ring koppelen">
        <RingLogin onDone={() => setLoginOpen(false)} />
      </Dialog>
      <Dialog open={detailOpen && !!camera} onClose={() => setDetailOpen(false)} title={camera?.name} className="max-w-2xl">
        {camera && <RingDetail camera={camera} onLogout={() => void logout()} />}
      </Dialog>
    </div>
  )
}
