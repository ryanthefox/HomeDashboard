import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, Music, Search, ListMusic, History,
  Speaker, Monitor, Smartphone, Tv, Cast, Car, Radio, Loader2, Link2, ExternalLink, RefreshCw, Check, AlertTriangle, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { spotifyApi, type SpotifyDevice, type SpotifyItem, type SpotifyPlayback, type SpotifyStatus } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Panel, Press, Segmented, Skeleton, EmptyState, spring } from '@/components/ui/motion'
import { Dialog } from '@/components/ui/Dialog'
import { ArtBackdrop } from '../home/MiniMusic'
import { useContainerSize } from '../home/shared'
import { ThisDeviceRow } from './ThisDevice'
import { useBrowserPlayer } from '@/lib/spotifyPlayer'

const GREEN = '#1ed760'
const fmt = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

export function deviceIcon(type: string) {
  const t = type.toLowerCase()
  if (t === 'computer') return Monitor
  if (t === 'smartphone' || t === 'tablet') return Smartphone
  if (t === 'tv' || t === 'castvideo') return Tv
  if (t === 'castaudio') return Cast
  if (t === 'automobile') return Car
  if (t === 'avr' || t === 'stb' || t === 'audiodongle') return Radio
  return Speaker
}

// ── Connect (one-time login) ──────────────────────────────────────────────────
function SpotifyConnect({ status, onCancel }: { status: SpotifyStatus; onCancel?: () => void }) {
  const qc = useQueryClient()
  const [step, setStep] = useState<1 | 2>(1)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(status.error)
  const manual = /^http:\/\/(127\.0\.0\.1|\[::1\])/.test(status.redirectUri)

  const open = async () => {
    setErr(null)
    try {
      const { url } = await spotifyApi.loginUrl()
      if (manual) { window.open(url, '_blank', 'noopener'); setStep(2) } else window.location.href = url
    } catch (e) { setErr(e instanceof Error ? e.message : 'Mislukt') }
  }
  const submit = async () => {
    setBusy(true); setErr(null)
    try { await spotifyApi.sendCode(code); await qc.invalidateQueries({ queryKey: ['spotify'] }) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Koppelen mislukt') }
    setBusy(false)
  }

  if (!status.configured) {
    return (
      <Panel className="mx-auto max-w-lg p-6">
        <EmptyState icon={<Music className="h-5 w-5" />} title="Spotify is nog niet ingesteld"
          hint="Maak een app op developer.spotify.com en zet SPOTIFY_CLIENT_ID en SPOTIFY_CLIENT_SECRET in de .env op de server" />
      </Panel>
    )
  }
  return (
    <Panel className="mx-auto w-full max-w-lg p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${GREEN}22`, color: GREEN }}><Music className="h-5 w-5" /></span>
        <div>
          <p className="text-lg font-semibold tracking-tight text-fg">Spotify koppelen</p>
          <p className="text-xs text-fg3">Eenmalig — daarna blijft het dashboard gekoppeld</p>
        </div>
        {onCancel && <button onClick={onCancel} className="ml-auto rounded-lg px-2 py-1 text-xs text-fg3 hover:text-fg">Annuleren</button>}
      </div>

      <div className="flex flex-col gap-3">
        <div className={cn('rounded-2xl p-4', step === 1 ? 'bg-card4' : 'bg-card3')}>
          <p className="mb-2 text-sm font-medium text-fg">1. Log in bij Spotify en geef toegang</p>
          <button onClick={() => void open()} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black" style={{ background: GREEN }}>
            <ExternalLink className="h-4 w-4" /> Inloggen bij Spotify
          </button>
        </div>
        {manual && (
          <div className={cn('rounded-2xl p-4', step === 2 ? 'bg-card4' : 'bg-card3')}>
            <p className="text-sm font-medium text-fg">2. Plak het adres van de pagina waar je op uitkomt</p>
            <p className="mb-2 mt-1 text-xs text-fg3">
              Na het inloggen opent een pagina die niet laadt (<span className="text-fg2">127.0.0.1…</span>). Dat hoort zo: kopieer het hele adres uit de adresbalk en plak het hier.
            </p>
            <div className="flex gap-2">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="http://127.0.0.1:8888/callback?code=…"
                className="min-w-0 flex-1 rounded-xl bg-card3 px-3 py-2 text-sm text-fg outline-none placeholder:text-fg3 focus:ring-1 focus:ring-white/20" />
              <button onClick={() => void submit()} disabled={!code.trim() || busy}
                className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold disabled:opacity-40">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Koppelen
              </button>
            </div>
          </div>
        )}
        {err && <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertTriangle className="h-3.5 w-3.5" />{err}</p>}
      </div>
    </Panel>
  )
}

// ── Device picker ─────────────────────────────────────────────────────────────
function DevicePicker({ open, onClose, current, onPick }: {
  open: boolean; onClose: () => void; current: string | null; onPick: (d: SpotifyDevice) => void
}) {
  const { data: allDevices, isFetching, refetch, error } = useQuery<SpotifyDevice[]>({
    queryKey: ['spotify', 'devices'], queryFn: spotifyApi.devices, enabled: open, refetchInterval: open ? 5000 : false,
  })
  const browser = useBrowserPlayer()
  const devices = allDevices?.filter(d => d.id !== browser.deviceId)
  return (
    <Dialog open={open} onClose={onClose} title="Afspelen op" className="max-w-md">
      <div className="p-4 pt-1">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-xs text-fg3">Spotify Connect-apparaten in je netwerk</p>
          <button onClick={() => void refetch()} className="rounded-lg p-1.5 text-fg3 hover:text-fg" title="Vernieuwen">
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <ThisDeviceRow activeId={current} onPick={id => onPick({ id, name: 'Dit apparaat', type: 'Computer', isActive: false, volume: null, restricted: false })} />
          {(devices ?? []).map(d => {
            const Icon = deviceIcon(d.type)
            const active = d.id === current
            return (
              <button key={d.id} onClick={() => onPick(d)} disabled={d.restricted}
                className={cn('flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors disabled:opacity-40', active ? 'bg-card4' : 'hover:bg-card3')}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card3" style={active ? { color: GREEN } : undefined}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium" style={active ? { color: GREEN } : undefined}>{d.name}</span>
                  <span className="block text-[11px] text-fg3">{d.isActive ? 'Speelt nu' : d.type}{d.volume != null && d.supportsVolume !== false ? ` · volume ${d.volume}%` : ''}</span>
                </span>
                {active && <Check className="h-4 w-4 shrink-0" style={{ color: GREEN }} />}
              </button>
            )
          })}
          {devices && devices.length === 0 && (
            <p className="px-2 py-4 text-sm text-fg3">
              Geen apparaten gevonden. Open Spotify op het apparaat (of zet je Sonos/speaker aan) en vernieuw — Spotify toont alleen apparaten die kort geleden actief waren.
            </p>
          )}
          {error && <p className="px-2 py-3 text-sm text-red-400">{(error as Error).message}</p>}
          {!devices && !error && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-fg3" /></div>}
        </div>
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-fg3">
          Een Bluetooth-box verschijnt niet zelf: die speelt af via het apparaat waarmee hij verbonden is (bijv. je telefoon of pc) — kies dat apparaat.
        </p>
      </div>
    </Dialog>
  )
}

// ── Now playing ───────────────────────────────────────────────────────────────
function NowPlaying({ pb, onError, onDevices, deviceId }: {
  pb: SpotifyPlayback | undefined; onError: (m: string | null) => void; onDevices: () => void; deviceId: string | null
}) {
  const qc = useQueryClient()
  const track = pb?.track ?? null
  const playing = !!pb?.isPlaying
  const [progress, setProgress] = useState(pb?.progressMs ?? 0)
  const [seeking, setSeeking] = useState<number | null>(null)
  const [vol, setVol] = useState<number | null>(null)
  const volTimer = useRef<number | undefined>(undefined)
  const boxRef = useRef<HTMLDivElement>(null)
  const { h: boxH, w: boxW } = useContainerSize(boxRef)
  // Album art takes whatever height is left after title, progress, controls and device row (~290px)
  const art = boxH ? Math.round(Math.max(72, Math.min(300, boxH - 290, boxW - 40))) : 240

  // Smooth progress between polls
  useEffect(() => { setProgress(pb?.progressMs ?? 0) }, [pb?.progressMs, track?.id])
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setProgress(p => Math.min(p + 500, track?.durationMs ?? p)), 500)
    return () => clearInterval(t)
  }, [playing, track?.durationMs])

  const act = async (fn: () => Promise<unknown>, optimistic?: (p: SpotifyPlayback) => SpotifyPlayback) => {
    onError(null)
    if (optimistic && pb) qc.setQueryData(['spotify', 'player'], optimistic(pb))
    try { await fn() } catch (e) { onError(e instanceof Error ? e.message : 'Mislukt') }
    setTimeout(() => void qc.invalidateQueries({ queryKey: ['spotify', 'player'] }), 450)
  }

  const togglePlay = () => playing
    ? act(spotifyApi.pause, p => ({ ...p, isPlaying: false }))
    : act(() => spotifyApi.play(pb?.device ? {} : { deviceId: deviceId ?? undefined }), p => ({ ...p, isPlaying: true }))
  const nextRepeat = pb?.repeat === 'off' ? 'context' : pb?.repeat === 'context' ? 'track' : 'off'
  const volume = vol ?? pb?.device?.volume ?? null
  const DevIcon = deviceIcon(pb?.device?.type ?? 'speaker')

  return (
    <Panel className="relative flex min-h-0 flex-col overflow-hidden">
      <ArtBackdrop art={track?.image ?? undefined} trackKey={track?.id ?? 'none'} intensity={0.5} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--c-solid)] opacity-70" />

      <div ref={boxRef} className="relative flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto px-5 py-5 scrollbar-hide sm:px-8 [&>*:first-child]:mt-auto [&>*:last-child]:mb-auto">
        <motion.div className="relative shrink-0 overflow-hidden rounded-[24px] bg-card4"
          animate={{ scale: playing ? 1 : 0.94 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{ width: art, height: art, boxShadow: '0 30px 60px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.06)' }}>
          <AnimatePresence initial={false}>
            {track?.image ? (
              <motion.img key={track.id} src={track.image} alt="" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"><Music className="h-14 w-14 text-fg3" /></div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="w-full max-w-md text-center">
          <p className="truncate text-xl font-semibold tracking-tight text-fg">{track?.name ?? 'Er speelt niets'}</p>
          <p className="truncate text-sm text-fg2">{track ? track.artists : 'Kies hiernaast een playlist of zoek een nummer'}</p>
        </div>

        {/* Progress */}
        <div className="w-full max-w-md">
          <input type="range" min={0} max={track?.durationMs || 1} value={seeking ?? progress} disabled={!track}
            onChange={e => setSeeking(Number(e.target.value))}
            onPointerUp={() => { if (seeking != null) { const ms = seeking; setProgress(ms); setSeeking(null); void act(() => spotifyApi.seek(ms)) } }}
            onKeyUp={() => { if (seeking != null) { const ms = seeking; setProgress(ms); setSeeking(null); void act(() => spotifyApi.seek(ms)) } }}
            className="h-1.5 w-full cursor-pointer accent-[#1ed760]" aria-label="Positie" />
          <div className="mt-1 flex justify-between text-[11px] text-fg3 tabular">
            <span>{fmt(seeking ?? progress)}</span><span>{fmt(track?.durationMs ?? 0)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Press onClick={() => act(() => spotifyApi.shuffle(!pb?.shuffle), p => ({ ...p, shuffle: !p.shuffle }))} title="Shuffle"
            className="rounded-full p-2.5 text-fg2 hover:text-fg" style={pb?.shuffle ? { color: GREEN } : undefined}>
            <Shuffle className="h-5 w-5" />
          </Press>
          <Press onClick={() => act(spotifyApi.previous)} title="Vorige" className="rounded-full p-2.5 text-fg hover:bg-card3"><SkipBack className="h-6 w-6" fill="currentColor" /></Press>
          <Press onClick={() => void togglePlay()} title={playing ? 'Pauze' : 'Afspelen'}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-zinc-950 shadow-xl">
            {playing ? <Pause className="h-7 w-7" fill="currentColor" /> : <Play className="ml-1 h-7 w-7" fill="currentColor" />}
          </Press>
          <Press onClick={() => act(spotifyApi.next)} title="Volgende" className="rounded-full p-2.5 text-fg hover:bg-card3"><SkipForward className="h-6 w-6" fill="currentColor" /></Press>
          <Press onClick={() => act(() => spotifyApi.repeat(nextRepeat), p => ({ ...p, repeat: nextRepeat }))} title="Herhalen"
            className="rounded-full p-2.5 text-fg2 hover:text-fg" style={pb?.repeat !== 'off' && pb ? { color: GREEN } : undefined}>
            {pb?.repeat === 'track' ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
          </Press>
        </div>

        {/* Device + volume */}
        <div className="flex w-full max-w-md flex-wrap items-center gap-3">
          <button onClick={onDevices} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-card3 px-3 py-2 text-left text-sm hover:bg-card4">
            <DevIcon className="h-4 w-4 shrink-0" style={pb?.device ? { color: GREEN } : undefined} />
            <span className="truncate font-medium text-fg">{pb?.device?.name ?? 'Kies een apparaat'}</span>
          </button>
          {pb?.device && pb.device.supportsVolume === false && (
            <span className="flex flex-1 items-center gap-1.5 text-[11px] text-fg3"><Volume2 className="h-3.5 w-3.5 shrink-0" />Volume regel je op het apparaat zelf</span>
          )}
          {pb?.device && volume != null && pb.device.supportsVolume !== false && (
            <div className="flex min-w-[150px] flex-1 items-center gap-2">
              <button onClick={() => { const v = volume > 0 ? 0 : 40; setVol(v); void act(() => spotifyApi.volume(v)) }} className="text-fg2 hover:text-fg">
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input type="range" min={0} max={100} value={volume} aria-label="Volume"
                onChange={e => {
                  const v = Number(e.target.value); setVol(v)
                  window.clearTimeout(volTimer.current)
                  volTimer.current = window.setTimeout(() => { void act(() => spotifyApi.volume(v)); setTimeout(() => setVol(null), 1500) }, 250)
                }}
                className="h-1.5 w-full cursor-pointer accent-[#1ed760]" />
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

// ── Library: playlists / search / recent ──────────────────────────────────────
type LibTab = 'playlists' | 'search' | 'recent'

function ItemRow({ item, active, onPlay, index }: { item: SpotifyItem; active: boolean; onPlay: () => void; index: number }) {
  const kindLabel = { track: 'Nummer', artist: 'Artiest', album: 'Album', playlist: 'Playlist' }[item.kind]
  return (
    <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 12) * 0.02 }}
      onClick={onPlay} className={cn('group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors', active ? 'bg-card4' : 'hover:bg-card3')}>
      <span className={cn('relative h-11 w-11 shrink-0 overflow-hidden bg-card4', item.kind === 'artist' ? 'rounded-full' : 'rounded-xl')}>
        {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Music className="m-3 h-5 w-5 text-fg3" />}
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-4 w-4 text-white" fill="currentColor" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium" style={active ? { color: GREEN } : undefined}>{item.name}</span>
        <span className="block truncate text-xs text-fg3">{kindLabel}{item.subtitle ? ` · ${item.subtitle}` : ''}</span>
      </span>
    </motion.button>
  )
}

function Library({ pb, onPlay }: { pb: SpotifyPlayback | undefined; onPlay: (item: SpotifyItem) => void }) {
  const [tab, setTab] = useLocalStorage<LibTab>('spotify-lib-tab', 'playlists')
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 350); return () => clearTimeout(t) }, [q])

  const playlists = useQuery({ queryKey: ['spotify', 'playlists'], queryFn: spotifyApi.playlists, enabled: tab === 'playlists', staleTime: 5 * 60_000 })
  const recent = useQuery({ queryKey: ['spotify', 'recent'], queryFn: spotifyApi.recent, enabled: tab === 'recent', staleTime: 60_000 })
  const search = useQuery({ queryKey: ['spotify', 'search', debounced], queryFn: () => spotifyApi.search(debounced), enabled: tab === 'search' && debounced.length > 1, staleTime: 60_000 })
  const active = tab === 'playlists' ? playlists : tab === 'recent' ? recent : search
  const items = active.data ?? []
  const isActive = (it: SpotifyItem) => it.uri === pb?.contextUri || it.uri === pb?.track?.uri

  return (
    <Panel index={1} className="flex min-h-[420px] flex-col p-4 sm:p-5 lg:min-h-0">
      <Segmented layoutId="spotify-lib" value={tab} onChange={setTab} size="sm" className="mb-3 self-start" items={[
        { id: 'playlists', label: <span className="flex items-center gap-1.5"><ListMusic className="h-3.5 w-3.5" />Playlists</span> },
        { id: 'search', label: <span className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5" />Zoeken</span> },
        { id: 'recent', label: <span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5" />Recent</span> },
      ]} />
      {tab === 'search' && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-card3 px-3">
          <Search className="h-4 w-4 shrink-0 text-fg3" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nummer, artiest, album of playlist"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-fg outline-none placeholder:text-fg3" />
          {search.isFetching && <Loader2 className="h-4 w-4 animate-spin text-fg3" />}
        </div>
      )}
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 scrollbar-hide">
        {active.isLoading && (tab !== 'search' || debounced.length > 1) ? (
          <div className="flex flex-col gap-2">{[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-2xl" />)}</div>
        ) : active.error ? (
          <p className="py-6 text-center text-sm text-red-400">{(active.error as Error).message}</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg3">
            {tab === 'search' ? (debounced.length > 1 ? 'Niets gevonden' : 'Typ om te zoeken') : tab === 'recent' ? 'Nog niets beluisterd' : 'Geen playlists'}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">{items.map((it, i) => <ItemRow key={it.uri + i} item={it} index={i} active={isActive(it)} onPlay={() => onPlay(it)} />)}</div>
        )}
      </div>
    </Panel>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SpotifyView() {
  const qc = useQueryClient()
  const { data: status, isLoading } = useQuery<SpotifyStatus>({ queryKey: ['spotify', 'status'], queryFn: spotifyApi.status, staleTime: 60_000 })
  const connected = !!status?.connected
  const { data: pb } = useQuery<SpotifyPlayback>({
    queryKey: ['spotify', 'player'], queryFn: spotifyApi.player, enabled: connected,
    refetchInterval: 3000, refetchIntervalInBackground: false,
  })
  const [deviceId, setDeviceId] = useLocalStorage<string>('spotify-device', '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingItem, setPendingItem] = useState<SpotifyItem | null>(null)
  const [relink, setRelink] = useState(false)
  useEffect(() => { if (!error) return; const t = setTimeout(() => setError(null), 6000); return () => clearTimeout(t) }, [error])
  const playback = pb && !pb.idle ? pb : undefined

  useEffect(() => { if (playback?.device?.id) setDeviceId(playback.device.id) }, [playback?.device?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => setTimeout(() => void qc.invalidateQueries({ queryKey: ['spotify', 'player'] }), 600)

  async function playItem(item: SpotifyItem, onDevice?: string) {
    setError(null)
    const target = onDevice ?? (playback?.device ? undefined : deviceId || undefined)
    if (!playback?.device && !target) { setPendingItem(item); setPickerOpen(true); return }
    try {
      await spotifyApi.play(item.kind === 'track' ? { uris: [item.uri], deviceId: target } : { contextUri: item.uri, deviceId: target })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Afspelen mislukt'
      // No active device any more → let the user pick one, then retry
      if (/apparaat/.test(msg)) { setPendingItem(item); setPickerOpen(true) } else setError(msg)
    }
    refresh()
  }

  async function pickDevice(d: SpotifyDevice) {
    setPickerOpen(false); setDeviceId(d.id); setError(null)
    try {
      if (pendingItem) { const it = pendingItem; setPendingItem(null); await playItem(it, d.id); return }
      await spotifyApi.transfer(d.id, playback?.isPlaying ?? true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Wisselen mislukt') }
    refresh()
  }

  const logout = async () => { await spotifyApi.logout().catch(() => {}); await qc.invalidateQueries({ queryKey: ['spotify'] }) }

  if (isLoading) return <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-[480px] rounded-3xl" /><Skeleton className="h-[480px] rounded-3xl" /></div>
  if (!status || !status.connected) return status ? <SpotifyConnect status={status} /> : null
  if (relink) return <SpotifyConnect status={status} onCancel={() => setRelink(false)} />

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto scrollbar-hide lg:overflow-hidden">
      {status.product && status.product !== 'premium' && (
        <p className="flex items-center gap-2 rounded-2xl bg-amber-400/10 px-4 py-2.5 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" /> Je account is geen Spotify Premium: Spotify staat afspelen en bedienen vanuit andere apps dan alleen met Premium toe.
        </p>
      )}
      {!status.canStream && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-4 py-2.5 text-xs" style={{ background: `${GREEN}14`, color: GREEN }}>
          <span className="flex-1">Nieuw: muziek afspelen op dit apparaat zelf. Koppel Spotify één keer opnieuw om dat aan te zetten.</span>
          <button onClick={() => setRelink(true)} className="rounded-lg px-2.5 py-1 font-semibold text-black" style={{ background: GREEN }}>Opnieuw koppelen</button>
        </div>
      )}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}
            className="flex items-center gap-2 rounded-2xl bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="grid shrink-0 grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:shrink lg:grid-cols-[minmax(0,1fr)_400px]">
        <NowPlaying pb={playback} onError={setError} onDevices={() => setPickerOpen(true)} deviceId={deviceId || null} />
        <Library pb={playback} onPlay={item => void playItem(item)} />
      </div>
      <div className="flex shrink-0 items-center justify-end gap-3 px-1 text-xs text-fg3">
        {status.user && <span>Ingelogd als {status.user}</span>}
        <button onClick={() => void logout()} className="flex items-center gap-1 hover:text-red-400"><LogOut className="h-3 w-3" />Ontkoppelen</button>
      </div>
      <DevicePicker open={pickerOpen} onClose={() => { setPickerOpen(false); setPendingItem(null) }}
        current={playback?.device?.id ?? null} onPick={d => void pickDevice(d)} />
    </div>
  )
}
