import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import {
  BellRing, Bell, Footprints, Eye, Play, Square, Radio, Volume2, VolumeX, RefreshCw, BatteryMedium,
  Loader2, Maximize, Plus, X, History, Camera,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ringApi, type RingCamera, type RingEventItem, type RingEventKind } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useRingStatus, useRingEventTick, eventLabel, timeAgo } from '@/lib/ring'
import { useRingLive } from '@/lib/ringLive'
import { Panel, Label, Segmented, Skeleton, EmptyState } from '@/components/ui/motion'
import { RingLogin } from './ring/RingLogin'
import { RingSnapshot } from './ring/RingDetail'

type Filter = 'all' | RingEventKind
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Alles' },
  { id: 'ding', label: 'Aangebeld' },
  { id: 'motion', label: 'Beweging' },
  { id: 'on_demand', label: 'Live' },
]
const PAGE = 20

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtCountdown = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

function requestFullscreen(el: HTMLElement | null) {
  const e = el as (HTMLElement & { webkitRequestFullscreen?: () => void; webkitEnterFullscreen?: () => void }) | null
  if (!e) return
  if (e.requestFullscreen) void e.requestFullscreen().catch(() => {})
  else e.webkitRequestFullscreen?.() ?? e.webkitEnterFullscreen?.()
}

// ── Viewer: snapshot, live view or a recording ────────────────────────────────
type Recording = { event: RingEventItem; url: string }

function Viewer({ camera, recording, onCloseRecording }: {
  camera: RingCamera; recording: Recording | null; onCloseRecording: () => void
}) {
  const live = useRingLive(camera.id)
  const liveTick = useRingEventTick(camera.id)
  const [manual, setManual] = useState(0)
  const [muted, setMuted] = useState(true)
  const boxRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isLive = live.state === 'live' || live.state === 'connecting'

  useEffect(() => { if (videoRef.current) videoRef.current.srcObject = live.stream }, [live.stream])
  // A recording takes over the viewer → stop live
  useEffect(() => { if (recording) live.stop() }, [recording]) // eslint-disable-line react-hooks/exhaustive-deps
  // After live the camera is awake: grab a fresh snapshot
  const wasLive = useRef(false)
  useEffect(() => { if (wasLive.current && !isLive) setManual(m => m + 1); wasLive.current = isLive }, [isLive])

  const startLive = () => { onCloseRecording(); setMuted(true); void live.start() }

  return (
    <Panel index={0} className="flex flex-col overflow-hidden lg:min-h-0 lg:flex-1">
      <div ref={boxRef} className="relative aspect-video w-full bg-black lg:aspect-auto lg:min-h-0 lg:flex-1">
        {recording ? (
          <video key={recording.url} src={recording.url} controls autoPlay playsInline className="h-full w-full bg-black object-contain" />
        ) : (
          <>
            <RingSnapshot camera={camera} tick={liveTick * 1000 + manual} className="absolute inset-0" />
            {isLive && (
              <video ref={videoRef} autoPlay playsInline muted={muted}
                className={cn('absolute inset-0 h-full w-full bg-black object-contain transition-opacity duration-500', live.state === 'live' ? 'opacity-100' : 'opacity-0')} />
            )}
          </>
        )}

        {/* Top-left badge */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
          {recording ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-md">
              <History className="h-3.5 w-3.5" /> Opname · {fmtTime(recording.event.createdAt)}
            </span>
          ) : live.state === 'live' ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-red-500/90 px-2 py-1 text-xs font-semibold text-white">
              <motion.span className="h-1.5 w-1.5 rounded-full bg-white" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
              LIVE · {fmtCountdown(live.remaining)}
            </span>
          ) : live.state === 'connecting' ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-md">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verbinden met camera…
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-md">
              <Camera className="h-3.5 w-3.5" /> Snapshot
            </span>
          )}
        </div>

        {/* Top-right */}
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {camera.hasBattery && camera.batteryLevel != null && (
            <span className={cn('flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs backdrop-blur-md tabular', camera.batteryLevel < 20 ? 'text-red-300' : 'text-white')}>
              <BatteryMedium className="h-3.5 w-3.5" /> {camera.batteryLevel}%
            </span>
          )}
          {recording && (
            <button onClick={onCloseRecording} aria-label="Opname sluiten" className="rounded-xl bg-black/60 p-2 text-white backdrop-blur-md hover:bg-black/75">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Big play button over the snapshot */}
        {!recording && !isLive && !camera.isOffline && (
          <button onClick={startLive} className="group absolute inset-0 flex items-center justify-center" aria-label="Live bekijken">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-transform group-hover:scale-105 group-active:scale-95">
              <Play className="ml-1 h-7 w-7" fill="currentColor" />
            </span>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 p-3 sm:p-4">
        {isLive ? (
          <>
            <button onClick={live.stop} className="flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
              <Square className="h-3.5 w-3.5" fill="currentColor" /> Stoppen
            </button>
            <button onClick={() => setMuted(m => !m)} disabled={live.state !== 'live'}
              className="flex items-center gap-2 rounded-xl bg-card3 px-3 py-2 text-sm font-medium text-fg2 hover:text-fg disabled:opacity-40">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{muted ? 'Geluid aan' : 'Geluid uit'}</span>
            </button>
            <button onClick={live.extend} className="flex items-center gap-1.5 rounded-xl bg-card3 px-3 py-2 text-sm font-medium text-fg2 hover:text-fg">
              <Plus className="h-4 w-4" /> Verlengen
            </button>
          </>
        ) : (
          <button onClick={startLive} disabled={camera.isOffline}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold disabled:opacity-40">
            <Radio className="h-4 w-4" /> Live bekijken
          </button>
        )}
        {!isLive && !recording && (
          <button onClick={() => setManual(m => m + 1)} className="flex items-center gap-2 rounded-xl bg-card3 px-3 py-2 text-sm font-medium text-fg2 hover:text-fg">
            <RefreshCw className="h-4 w-4" /> <span className="hidden sm:inline">Nieuwe snapshot</span>
          </button>
        )}
        <button onClick={() => requestFullscreen(boxRef.current)} title="Volledig scherm"
          className="ml-auto rounded-xl bg-card3 p-2 text-fg2 hover:text-fg">
          <Maximize className="h-4 w-4" />
        </button>
        {live.error && <p className="w-full text-xs text-red-400">{live.error}</p>}
        {!live.error && isLive && <p className="w-full text-[11px] text-fg3">Stopt vanzelf na 3 minuten of als je de tab verlaat, om de batterij te sparen.</p>}
      </div>
    </Panel>
  )
}

// ── Event list ────────────────────────────────────────────────────────────────
function EventItem({ ev, camera, playing, onPlay }: {
  ev: RingEventItem; camera: RingCamera; playing: boolean; onPlay: (r: Recording) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const Icon = ev.kind === 'ding' ? Bell : ev.kind === 'motion' ? Footprints : Eye

  async function play() {
    setBusy(true); setErr(null)
    const r = await ringApi.getRecording(camera.id, ev.id).catch(() => ({} as { url?: string }))
    setBusy(false)
    if (r.url) onPlay({ event: ev, url: r.url }); else setErr('Geen opname (Ring Protect nodig)')
  }

  return (
    <button onClick={ev.recorded ? play : undefined} disabled={!ev.recorded || busy}
      className={cn('flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors',
        playing ? 'bg-card4' : ev.recorded ? 'hover:bg-card3' : 'cursor-default')}>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
        ev.kind === 'ding' ? 'bg-orange-400/15 text-orange-300' : 'bg-card3 text-fg2')}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-fg">
          {eventLabel(ev.kind)}
          {ev.kind === 'ding' && !ev.answered && <span className="ml-1.5 text-xs font-normal text-fg3">· gemist</span>}
        </span>
        <span className="block truncate text-xs text-fg3">{err ?? `${fmtTime(ev.createdAt)} · ${timeAgo(ev.createdAt)}`}</span>
      </span>
      {ev.recorded && (
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', playing ? 'bg-accent' : 'bg-card3 text-fg2')}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" fill="currentColor" />}
        </span>
      )}
    </button>
  )
}

function dayHeading(iso: string) {
  const d = new Date(iso), today = new Date()
  const y = new Date(today); y.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Vandaag'
  if (d.toDateString() === y.toDateString()) return 'Gisteren'
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function EventList({ camera, playingId, onPlay, onLogout }: {
  camera: RingCamera; playingId: string | null; onPlay: (r: Recording) => void; onLogout: () => void
}) {
  const [filter, setFilter] = useLocalStorage<Filter>('ring-event-filter', 'all')
  const kind = filter === 'all' ? undefined : filter
  const q = useInfiniteQuery({
    queryKey: ['ring', 'events', camera.id, 'paged', filter],
    queryFn: ({ pageParam }) => ringApi.getEvents(camera.id, PAGE, kind, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: last => last.next ?? undefined,
    staleTime: 30_000,
  })
  const events = q.data?.pages.flatMap(p => p.events ?? []) ?? []
  const error = q.data?.pages[0]?.error

  // Group per day
  const groups: { day: string; items: RingEventItem[] }[] = []
  for (const ev of events) {
    const day = dayHeading(ev.createdAt)
    if (groups.at(-1)?.day !== day) groups.push({ day, items: [] })
    groups.at(-1)!.items.push(ev)
  }

  return (
    <Panel index={1} className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Label icon={<History />}>Gebeurtenissen</Label>
        <button onClick={() => void q.refetch()} title="Vernieuwen" className="rounded-lg p-1.5 text-fg3 hover:text-fg">
          <RefreshCw className={cn('h-3.5 w-3.5', q.isRefetching && 'animate-spin')} />
        </button>
      </div>
      <Segmented items={FILTERS} value={filter} onChange={setFilter} layoutId="ring-filter" size="sm" className="mb-3 self-start overflow-x-auto scrollbar-hide max-w-full" />

      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 scrollbar-hide">
        {q.isLoading ? (
          <div className="flex flex-col gap-2">{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-2xl" />)}</div>
        ) : error ? (
          <p className="py-8 text-center text-sm text-fg3">{error}</p>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg3">Geen gebeurtenissen</p>
        ) : (
          <>
            {groups.map(g => (
              <div key={g.day} className="mb-2">
                <p className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-fg3 first-letter:uppercase">{g.day}</p>
                {g.items.map(ev => <EventItem key={ev.id} ev={ev} camera={camera} playing={playingId === ev.id} onPlay={onPlay} />)}
              </div>
            ))}
            {q.hasNextPage && (
              <button onClick={() => void q.fetchNextPage()} disabled={q.isFetchingNextPage}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-card3 py-2 text-sm font-medium text-fg2 hover:text-fg disabled:opacity-50">
                {q.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />} Meer laden
              </button>
            )}
          </>
        )}
      </div>
      <div className="mt-3 flex justify-end border-t border-subtle pt-3 text-xs">
        <button onClick={onLogout} className="text-fg3 hover:text-red-400">Ring ontkoppelen</button>
      </div>
    </Panel>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function RingWidget() {
  const qc = useQueryClient()
  const { data: status, isLoading } = useRingStatus()
  const cams = status?.cameras ?? []
  const [selectedId, setSelectedId] = useLocalStorage<string>('ring-tab-camera', '')
  const camera = cams.find(c => c.id === selectedId) ?? cams[0]
  const [recording, setRecording] = useState<Recording | null>(null)

  // (new events arrive via SignalR, which invalidates ['ring'] → the list refreshes itself)
  useEffect(() => { setRecording(null) }, [camera?.id])

  const logout = async () => {
    await ringApi.logout().catch(() => {})
    await qc.invalidateQueries({ queryKey: ['ring'] })
  }

  let body: React.ReactNode
  if (isLoading) {
    body = (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="aspect-video rounded-3xl" /><Skeleton className="h-96 rounded-3xl" />
      </div>
    )
  } else if (!status || status.bridgeDown) {
    body = <Panel className="flex p-8"><EmptyState icon={<BellRing className="h-5 w-5" />} title="Ring-koppeling draait niet" hint="Start de ring-container (docker compose up -d)" /></Panel>
  } else if (status.needsLogin) {
    body = (
      <Panel className="mx-auto w-full max-w-md overflow-hidden">
        <div className="px-5 pt-5"><Label icon={<BellRing />}>Ring koppelen</Label>
          {status.error && <p className="mt-2 text-xs text-red-400">{status.error}</p>}</div>
        <RingLogin onDone={() => void qc.invalidateQueries({ queryKey: ['ring'] })} />
      </Panel>
    )
  } else if (!camera) {
    body = <Panel className="flex p-8"><EmptyState icon={<BellRing className="h-5 w-5" />} title="Geen camera's gevonden" /></Panel>
  } else {
    body = (
      <div className="grid gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4 lg:min-h-0">
          {cams.length > 1 && (
            <Segmented items={cams.map(c => ({ id: c.id, label: c.name }))} value={camera.id} onChange={setSelectedId}
              layoutId="ring-cam" className="self-start overflow-x-auto scrollbar-hide max-w-full" />
          )}
          <Viewer camera={camera} recording={recording} onCloseRecording={() => setRecording(null)} />
        </div>
        <div className="flex min-h-[420px] flex-col lg:min-h-0">
          <EventList camera={camera} playingId={recording?.event.id ?? null} onPlay={setRecording} onLogout={() => void logout()} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide lg:overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={status?.needsLogin ? 'login' : 'main'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="mx-auto h-full max-w-7xl pb-4">
          {body}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
