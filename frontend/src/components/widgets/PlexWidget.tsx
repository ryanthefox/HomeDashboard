import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { Tv, Play, Pause, Monitor, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { plexApi, type PlexItem, type PlexSession } from '@/lib/api'
import { plexMeta, formatDuration } from '@/lib/plex'
import { Panel, Segmented, EmptyState, Skeleton, easeOutExpo } from '@/components/ui/motion'

function PosterCard({ item, index }: { item: PlexItem; index: number }) {
  const [imgError, setImgError] = useState(false)
  const meta = plexMeta(item)
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: easeOutExpo, delay: Math.min(index, 16) * 0.03 }}
      whileHover={{ y: -4 }}
      className="group flex flex-col"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-card4"
        style={{ boxShadow: '0 16px 30px -14px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.05)' }}>
        {item.thumbUrl && !imgError ? (
          <img src={item.thumbUrl} alt={item.title} loading="lazy" onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
        ) : (
          <div className="flex h-full w-full items-center justify-center"><Tv className="h-8 w-8 text-fg3" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {item.summary && (
          <p className="absolute inset-x-0 bottom-0 line-clamp-4 translate-y-2 p-2.5 text-[10px] leading-relaxed text-zinc-200 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            {item.summary}
          </p>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-200 backdrop-blur-sm">
          {item.type === 'movie' ? 'Film' : item.type === 'episode' ? 'Serie' : item.type}
        </span>
      </div>
      <div className="px-0.5 pt-2">
        <p className="line-clamp-1 text-xs font-semibold text-fg">{item.type === 'episode' && item.showTitle ? item.showTitle : item.title}</p>
        {meta && <p className="truncate text-[10px] text-fg3">{item.type === 'episode' ? `${plexMeta({ ...item, showTitle: null })} · ${item.title}` : meta}</p>}
      </div>
    </motion.div>
  )
}

function NowPlayingCard({ session, index }: { session: PlexSession; index: number }) {
  const [imgError, setImgError] = useState(false)
  const meta      = plexMeta(session)
  const progress  = session.duration > 0 ? (session.viewOffset / session.duration) * 100 : 0
  const playing   = session.state === 'playing'

  return (
    <Panel index={index} className="relative flex items-center gap-4 overflow-hidden p-4">
      {session.thumbUrl && !imgError && (
        <img src={session.thumbUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-2xl saturate-150" />
      )}
      <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-card4 shadow-xl">
        {session.thumbUrl && !imgError
          ? <img src={session.thumbUrl} alt={session.title} className="h-full w-full object-cover" onError={() => setImgError(true)} />
          : <div className="flex h-full w-full items-center justify-center"><Tv className="h-6 w-6 text-fg3" /></div>}
      </div>
      <div className="relative min-w-0 flex-1">
        <p className={cn('mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider', playing ? 'text-emerald-400' : 'text-amber-400')}>
          {playing ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3" />}
          {playing ? 'Speelt af' : 'Gepauzeerd'}
        </p>
        <p className="truncate text-base font-semibold text-fg">{session.title}</p>
        {meta && <p className="truncate text-xs text-fg2">{meta}</p>}
        {session.duration > 0 && (
          <div className="mt-2.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--c-track)]">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                initial={{ width: 0 }} animate={{ width: `${Math.min(100, progress)}%` }} transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                style={{ boxShadow: '0 0 10px rgba(251,146,60,.6)' }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-fg3 tabular">
              <span>{formatDuration(session.viewOffset)}</span>
              <span>-{formatDuration(session.duration - session.viewOffset)}</span>
            </div>
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-fg3">
          {session.playerName && <span className="flex items-center gap-1"><Monitor className="h-3 w-3" />{session.playerName}</span>}
          {session.user && <span className="flex items-center gap-1"><User className="h-3 w-3" />{session.user}</span>}
        </div>
      </div>
    </Panel>
  )
}

type PlexTab = 'ondeck' | 'recent'

export function PlexWidget() {
  const [tab, setTab] = useState<PlexTab>('ondeck')

  const { data: sessions = [] } = useQuery<PlexSession[]>({
    queryKey: ['plex', 'sessions'], queryFn: plexApi.getSessions, refetchInterval: 5_000, staleTime: 5_000,
  })
  const { data: onDeck = [], isLoading: loadingDeck } = useQuery<PlexItem[]>({
    queryKey: ['plex', 'ondeck'], queryFn: plexApi.getOnDeck, refetchInterval: 60_000, staleTime: 30_000,
  })
  const { data: recent = [], isLoading: loadingRecent } = useQuery<PlexItem[]>({
    queryKey: ['plex', 'recent'], queryFn: plexApi.getRecent, refetchInterval: 5 * 60_000, staleTime: 60_000,
  })

  const items   = tab === 'ondeck' ? onDeck : recent
  const loading = tab === 'ondeck' ? loadingDeck : loadingRecent

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold tracking-tight text-fg">Plex</p>
          {sessions.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />{sessions.length} actief
            </span>
          )}
        </div>
        <Segmented layoutId="plex-tab" size="sm" value={tab} onChange={setTab}
          items={[{ id: 'ondeck', label: 'Verder kijken' }, { id: 'recent', label: 'Nieuw toegevoegd' }]} />
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-4 scrollbar-hide">
        {sessions.length > 0 && (
          <section className="grid gap-3 lg:grid-cols-2">
            {sessions.map((s, i) => <NowPlayingCard key={s.key} session={s} index={i} />)}
          </section>
        )}

        <AnimatePresence mode="wait">
          <motion.section key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {loading ? (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />)}
              </div>
            ) : items.length === 0 ? (
              <EmptyState icon={<Tv className="h-5 w-5" />} title="Niets gevonden" hint="Controleer Plex:ServerUrl en Plex:Token" />
            ) : (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {items.map((item, i) => <PosterCard key={item.key} item={item} index={i} />)}
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  )
}
