import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Tv, Play, Pause } from 'lucide-react'
import { plexApi, type PlexItem, type PlexSession } from '@/lib/api'
import { plexMeta } from '@/lib/plex'
import { EmptyState, Skeleton } from '@/components/ui/motion'
import { useContainerSize, TileHeader } from './shared'

function Poster({ src, className }: { src: string | null; className?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-card4 ${className ?? ''}`} style={{ boxShadow: '0 8px 20px -8px rgba(0,0,0,.6)' }}>
      {src
        ? <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
        : <div className="flex h-full w-full items-center justify-center"><Tv className="h-3.5 w-3.5 text-fg3" /></div>}
    </div>
  )
}

export function MiniPlex() {
  const ref = useRef<HTMLDivElement>(null)
  const { h } = useContainerSize(ref)
  const { data: sessions = [] } = useQuery<PlexSession[]>({
    queryKey: ['plex', 'sessions'], queryFn: plexApi.getSessions, refetchInterval: 10_000, staleTime: 5_000,
  })
  const { data: onDeck = [], isLoading } = useQuery<PlexItem[]>({
    queryKey: ['plex', 'ondeck'], queryFn: plexApi.getOnDeck, refetchInterval: 60_000, staleTime: 30_000,
  })

  const live  = sessions[0]
  const rows  = Math.max(1, Math.floor((h - 56 - (live ? 96 : 0)) / 56))
  const shown = onDeck.slice(0, Math.min(rows, 5))

  return (
    <div ref={ref} className="relative flex h-full flex-col overflow-hidden p-4">
      {live?.thumbUrl && (
        <img src={live.thumbUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full scale-150 object-cover opacity-25 blur-3xl saturate-150" />
      )}
      <TileHeader icon={<Tv />} title="Plex"
        right={sessions.length > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Live
          </span>
        )} />

      {live && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mb-3 flex shrink-0 items-center gap-3 rounded-2xl bg-card3 p-2.5">
          <Poster src={live.thumbUrl} className="h-16 w-11" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              {live.state === 'playing' ? <Play className="h-2.5 w-2.5 fill-current" /> : <Pause className="h-2.5 w-2.5" />}
              {live.playerName ?? 'Speelt af'}
            </p>
            <p className="truncate text-sm font-semibold text-fg">{live.title}</p>
            {plexMeta(live) && <p className="truncate text-[11px] text-fg3">{plexMeta(live)}</p>}
            {live.duration > 0 && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--c-track)]">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-1000"
                  style={{ width: `${Math.min(100, (live.viewOffset / live.duration) * 100)}%` }} />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[0, 1].map(i => <Skeleton key={i} className="h-12" />)}</div>
      ) : shown.length === 0 && !live ? (
        <EmptyState icon={<Tv className="h-5 w-5" />} title="Niets om verder te kijken" />
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {shown.length > 0 && live && <p className="label-caps">Verder kijken</p>}
          {shown.map((item, i) => (
            <motion.div key={item.key}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3">
              <Poster src={item.thumbUrl} className="h-12 w-8" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-fg">{item.type === 'episode' && item.showTitle ? item.showTitle : item.title}</p>
                <p className="truncate text-[11px] text-fg3">
                  {item.type === 'episode' ? `${plexMeta({ ...item, showTitle: null }) ?? ''} · ${item.title}` : plexMeta(item)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
