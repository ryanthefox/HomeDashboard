import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Footprints, Play, RefreshCw, BatteryMedium, Loader2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ringApi, type RingCamera, type RingEventItem } from '@/lib/api'
import { eventLabel, timeAgo, useRingEventTick } from '@/lib/ring'

export function RingSnapshot({ camera, tick, className }: { camera: RingCamera; tick: number; className?: string }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={cn('relative overflow-hidden bg-black/40', className)}>
      {!failed ? (
        <img
          key={tick}
          src={ringApi.snapshotUrl(camera.id, tick)}
          alt={`Snapshot ${camera.name}`}
          onLoad={() => { setLoaded(true); setFailed(false) }}
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-3 text-center text-xs text-fg3">
          <Eye className="h-5 w-5" />
          {camera.isOffline ? 'Camera offline' : camera.snapshotsBlocked ? 'Snapshots staan uit in de Ring-app' : 'Nog geen snapshot beschikbaar'}
        </div>
      )}
      {!loaded && !failed && <div className="absolute inset-0 animate-pulse bg-card3" />}
    </div>
  )
}

function EventRow({ camera, ev }: { camera: RingCamera; ev: RingEventItem }) {
  const [video, setVideo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const Icon = ev.kind === 'ding' ? Bell : ev.kind === 'motion' ? Footprints : Eye

  async function play() {
    setBusy(true); setErr(null)
    const r = await ringApi.getRecording(camera.id, ev.id).catch(() => ({ error: 'mislukt' } as { url?: string; error?: string }))
    setBusy(false)
    if (r.url) setVideo(r.url); else setErr('Geen opname (Ring Protect nodig)')
  }

  return (
    <div className="py-2.5">
      <div className="flex items-center gap-3">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
          ev.kind === 'ding' ? 'bg-orange-400/15 text-orange-300' : 'bg-card3 text-fg2')}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">{eventLabel(ev.kind)}{ev.kind === 'ding' && !ev.answered && <span className="ml-1.5 text-xs font-normal text-fg3">· gemist</span>}</p>
          <p className="text-xs text-fg3">{new Date(ev.createdAt).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {timeAgo(ev.createdAt)}</p>
        </div>
        {ev.recorded && !video && (
          <button onClick={play} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-card3 px-2.5 py-1.5 text-xs font-medium text-fg2 transition-colors hover:text-fg disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Opname
          </button>
        )}
      </div>
      {err && <p className="mt-1 pl-11 text-xs text-fg3">{err}</p>}
      {video && <video src={video} controls autoPlay playsInline className="mt-2 w-full rounded-xl bg-black" />}
    </div>
  )
}

/** Big snapshot + recent events of one camera (shown in a dialog). */
export function RingDetail({ camera, onLogout }: { camera: RingCamera; onLogout: () => void }) {
  const qc = useQueryClient()
  const liveTick = useRingEventTick(camera.id)
  const [manual, setManual] = useState(0)
  const tick = liveTick * 1000 + manual
  const { data: events, isLoading } = useQuery({
    queryKey: ['ring', 'events', camera.id],
    queryFn: () => ringApi.getEvents(camera.id, 15),
    staleTime: 30_000,
  })
  const list = Array.isArray(events) ? events : []

  return (
    <div>
      <div className="relative">
        <RingSnapshot camera={camera} tick={tick} className="aspect-video w-full" />
        <button onClick={() => setManual(m => m + 1)} title="Nieuwe snapshot"
          className="absolute right-3 top-3 rounded-xl bg-black/55 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/70">
          <RefreshCw className="h-4 w-4" />
        </button>
        {camera.hasBattery && camera.batteryLevel != null && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-xs text-white backdrop-blur-md">
            <BatteryMedium className="h-3.5 w-3.5" /> {camera.batteryLevel}%
          </span>
        )}
      </div>

      <div className="px-5 pb-2 pt-4">
        <p className="label-caps">Recente gebeurtenissen</p>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-fg3" /></div>
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg3">Nog geen gebeurtenissen</p>
        ) : (
          <div className="divide-y divide-subtle">{list.map(ev => <EventRow key={ev.id} camera={camera} ev={ev} />)}</div>
        )}
      </div>

      <div className="flex justify-between gap-2 border-t border-subtle px-5 py-3 text-xs">
        <button onClick={() => void qc.invalidateQueries({ queryKey: ['ring'] })} className="text-fg3 hover:text-fg2">Vernieuwen</button>
        <button onClick={onLogout} className="text-fg3 hover:text-red-400">Ring ontkoppelen</button>
      </div>
    </div>
  )
}
