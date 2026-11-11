import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Tv, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { plexApi, type PlexItem, type PlexSession } from '@/lib/api'
import { plexMeta, plexProgress, DECISION_LABEL } from '@/lib/plex'
import { EmptyState, Skeleton } from '@/components/ui/motion'
import { useContainerSize, TileHeader } from './shared'
import { usePlexStats, PlexLink, PlexPoster, ProgressBar } from '../plex/shared'

const WIDE_MIN   = 520  // px: switch to poster rows
const HEADER_H   = 40
const LIVE_H     = 100
const LABEL_H    = 22
const CAPTION_H  = 36
const POSTER_GAP = 12

function itemTitle(item: PlexItem)    { return item.type === 'episode' && item.showTitle ? item.showTitle : item.title }
function itemSubtitle(item: PlexItem) {
  return item.type === 'episode' ? `${plexMeta({ ...item, showTitle: null }) ?? ''} · ${item.title}` : plexMeta(item)
}

function LiveCard({ live, extra }: { live: PlexSession; extra: number }) {
  const progress = live.duration > 0 ? live.viewOffset / live.duration : 0
  const decision = DECISION_LABEL[live.decision] ?? DECISION_LABEL.directplay
  return (
    <PlexLink ratingKey={live.key} className="relative z-10 mb-3 shrink-0">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="group flex items-center gap-3 rounded-2xl bg-card3 p-2.5 transition-colors hover:bg-card4">
        <PlexPoster src={live.thumbUrl} className="h-16 w-11" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            {live.state === 'playing' ? <Play className="h-2.5 w-2.5 shrink-0 fill-current" /> : <Pause className="h-2.5 w-2.5 shrink-0" />}
            <span className="truncate">{[live.user, live.playerName].filter(Boolean).join(' · ') || 'Speelt af'}</span>
          </p>
          <p className="truncate text-sm font-semibold text-fg">{live.title}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-fg3">
            {plexMeta(live) && <span className="truncate">{plexMeta(live)}</span>}
            <span className={cn('shrink-0 rounded px-1 py-px text-[9px] font-semibold', decision.tone)}>{decision.label}</span>
            {extra > 0 && <span className="shrink-0 text-fg2">+{extra}</span>}
          </div>
          {live.duration > 0 && <ProgressBar value={progress} className="mt-1.5" />}
        </div>
      </motion.div>
    </PlexLink>
  )
}

function PosterRow({ label, items, posterH, count }: { label: string; items: PlexItem[]; posterH: number; count: number }) {
  const posterW = Math.round(posterH * 2 / 3)
  return (
    <div className="relative z-10 flex shrink-0 flex-col">
      <p className="label-caps mb-2" style={{ height: LABEL_H - 8 }}>{label}</p>
      <div className="flex" style={{ gap: POSTER_GAP }}>
        {items.slice(0, count).map((item, i) => (
          <PlexLink key={item.key} ratingKey={item.key} className="shrink-0" >
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }} className="group" style={{ width: posterW }}>
              <PlexPoster src={item.thumbUrl} progress={plexProgress(item)} rounded="rounded-xl" height={posterH} className="w-full" />
              <div style={{ height: CAPTION_H }} className="pt-1.5">
                <p className="truncate text-[11px] font-semibold text-fg">{itemTitle(item)}</p>
                <p className="truncate text-[10px] text-fg3">{itemSubtitle(item)}</p>
              </div>
            </motion.div>
          </PlexLink>
        ))}
      </div>
    </div>
  )
}

export function MiniPlex() {
  const ref = useRef<HTMLDivElement>(null)
  const { w, h } = useContainerSize(ref)
  const { data: sessions = [] } = useQuery<PlexSession[]>({
    queryKey: ['plex', 'sessions'], queryFn: plexApi.getSessions, refetchInterval: 10_000, staleTime: 5_000,
  })
  const { data: onDeck = [], isLoading } = useQuery<PlexItem[]>({
    queryKey: ['plex', 'ondeck'], queryFn: plexApi.getOnDeck, refetchInterval: 60_000, staleTime: 30_000,
  })
  const { data: recent = [] } = useQuery<PlexItem[]>({
    queryKey: ['plex', 'recent'], queryFn: plexApi.getRecent, refetchInterval: 5 * 60_000, staleTime: 60_000,
  })
  const { data: stats } = usePlexStats()

  const live = sessions[0]
  const wide = w >= WIDE_MIN

  // ── Wide layout: poster rows sized to the tile ──────────────────────────────
  const available = h - HEADER_H - (live ? LIVE_H : 0)
  const rowExtra  = LABEL_H + CAPTION_H
  const twoRows   = wide && recent.length > 0 && onDeck.length > 0 && (available / 2 - rowExtra) >= 96
  const rowCount  = twoRows ? 2 : 1
  const posterH   = Math.max(72, Math.min(200, Math.floor(available / rowCount - rowExtra - (twoRows ? 8 : 0))))
  const posterW   = Math.round(posterH * 2 / 3)
  const perRow    = Math.max(1, Math.floor((w + POSTER_GAP) / (posterW + POSTER_GAP)))
  const firstRow  = onDeck.length > 0 ? { label: 'Verder kijken', items: onDeck } : { label: 'Nieuw toegevoegd', items: recent }

  // ── Narrow layout: list rows ────────────────────────────────────────────────
  const rows  = Math.max(1, Math.floor((h - 56 - (live ? 96 : 0)) / 60))
  const shown = onDeck.slice(0, Math.min(rows, 5))

  const headerRight = sessions.length > 0 ? (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />{sessions.length > 1 ? `${sessions.length} live` : 'Live'}
    </span>
  ) : stats ? (
    <span className="truncate text-[10px] font-medium text-fg3 tabular">
      {wide && `${stats.movies} films · ${stats.shows} series`}
      {stats.addedThisWeek > 0 && <span className="text-amber-400">{wide ? ' · ' : ''}+{stats.addedThisWeek} deze week</span>}
    </span>
  ) : null

  return (
    <div ref={ref} className="relative flex h-full flex-col overflow-hidden p-4">
      {live?.thumbUrl && (
        <img src={live.thumbUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full scale-150 object-cover opacity-25 blur-3xl saturate-150" />
      )}
      <TileHeader icon={<Tv />} title="Plex" right={headerRight} />

      {live && <LiveCard live={live} extra={sessions.length - 1} />}

      {isLoading ? (
        <div className="space-y-2">{[0, 1].map(i => <Skeleton key={i} className="h-12" />)}</div>
      ) : onDeck.length === 0 && recent.length === 0 && !live ? (
        <EmptyState icon={<Tv className="h-5 w-5" />} title="Niets om verder te kijken" />
      ) : wide ? (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {available - rowExtra >= 72 && <PosterRow label={firstRow.label} items={firstRow.items} posterH={posterH} count={perRow} />}
          {twoRows && <PosterRow label="Nieuw toegevoegd" items={recent} posterH={posterH} count={perRow} />}
        </div>
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {shown.length > 0 && live && <p className="label-caps">Verder kijken</p>}
          {shown.map((item, i) => {
            const progress = plexProgress(item)
            return (
              <PlexLink key={item.key} ratingKey={item.key}>
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="group flex items-center gap-3 rounded-xl transition-colors">
                  <PlexPoster src={item.thumbUrl} className="h-12 w-8" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-fg group-hover:underline">{itemTitle(item)}</p>
                    <p className="truncate text-[11px] text-fg3">{itemSubtitle(item)}</p>
                    {progress != null && <ProgressBar value={progress} className="mt-1 max-w-40" />}
                  </div>
                </motion.div>
              </PlexLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
