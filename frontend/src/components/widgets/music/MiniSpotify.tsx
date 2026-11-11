import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { Play, Pause, SkipBack, SkipForward, Music, Loader2, RefreshCw, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { spotifyApi, type SpotifyDevice, type SpotifyPlayback, type SpotifyStatus } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Press, spring } from '@/components/ui/motion'
import { useContainerSize, TileTitle } from '../home/shared'
import { ArtBackdrop, Equalizer, MusicSourceSwitch } from '../home/MiniMusic'
import { deviceIcon } from './SpotifyView'
import { ThisDeviceRow } from './ThisDevice'
import { useBrowserPlayer } from '@/lib/spotifyPlayer'

const GREEN = '#1ed760'

/** Home tile: Spotify now playing + Spotify Connect device picker. */
export function MiniSpotify() {
  const ref = useRef<HTMLDivElement>(null)
  const { h, w } = useContainerSize(ref)
  const qc = useQueryClient()
  const [, setTab] = useLocalStorage<string>('active-tab', 'home')
  const [, setDeviceId] = useLocalStorage<string>('spotify-device', '')
  const [err, setErr] = useState<string | null>(null)

  const { data: status, isLoading } = useQuery<SpotifyStatus>({ queryKey: ['spotify', 'status'], queryFn: spotifyApi.status, staleTime: 60_000 })
  const connected = !!status?.connected
  const { data: raw } = useQuery<SpotifyPlayback>({
    queryKey: ['spotify', 'player'], queryFn: spotifyApi.player, enabled: connected, refetchInterval: 4000,
  })
  const { data: devices, isFetching: loadingDevices, refetch: refetchDevices } = useQuery<SpotifyDevice[]>({
    queryKey: ['spotify', 'devices'], queryFn: spotifyApi.devices, enabled: connected, refetchInterval: 30_000, staleTime: 10_000,
  })

  const browser = useBrowserPlayer()
  const pb = raw && !raw.idle ? raw : undefined
  const track = pb?.track ?? null
  const playing = !!pb?.isPlaying
  const compact = h < 280
  const iconOnly = w > 0 && w < 190
  const artSize = compact ? 44 : Math.min(Math.max(h * 0.28, 64), 120, w > 0 ? w * 0.3 : 120)

  const refresh = () => setTimeout(() => {
    void qc.invalidateQueries({ queryKey: ['spotify', 'player'] })
    void qc.invalidateQueries({ queryKey: ['spotify', 'devices'] })
  }, 500)
  const act = async (fn: () => Promise<unknown>, optimistic?: Partial<SpotifyPlayback>) => {
    setErr(null)
    if (optimistic && pb) qc.setQueryData(['spotify', 'player'], { ...pb, ...optimistic })
    try { await fn() } catch (e) { setErr(e instanceof Error ? e.message : 'Mislukt') }
    refresh()
  }
  const pick = (id: string) => {
    setDeviceId(id)
    void act(() => spotifyApi.transfer(id, pb?.isPlaying ?? true))
  }

  if (isLoading) return <div ref={ref} className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-fg3" /></div>

  if (!connected) {
    return (
      <div ref={ref} className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${GREEN}22`, color: GREEN }}><Music className="h-5 w-5" /></span>
        <p className="text-sm font-medium text-fg">{status?.configured ? 'Spotify is nog niet gekoppeld' : 'Spotify is nog niet ingesteld'}</p>
        <button onClick={() => setTab('muziek')} className="flex items-center gap-0.5 text-xs text-fg3 hover:text-fg">
          Koppelen in de Muziek-tab <ChevronRight className="h-3 w-3" />
        </button>
        <div className="mt-1"><MusicSourceSwitch /></div>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative flex h-full flex-col overflow-hidden">
      <ArtBackdrop art={track?.image} trackKey={track?.id ?? 'none'} intensity={0.4} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--c-solid)] opacity-60" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-4">
        {/* Now playing */}
        <div className={cn('flex shrink-0 items-center gap-3', compact ? 'mb-2' : 'mb-3')}>
          <motion.div className="relative shrink-0 overflow-hidden rounded-2xl bg-card4"
            style={{ width: artSize, height: artSize, boxShadow: '0 12px 30px -10px rgba(0,0,0,.6)' }}
            animate={{ scale: playing ? 1 : 0.94 }} transition={spring}>
            <AnimatePresence initial={false}>
              {track?.image ? (
                <motion.img key={track.id} src={track.image} alt="" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center"><Music className="h-5 w-5 text-fg3" /></div>
              )}
            </AnimatePresence>
          </motion.div>
          {!iconOnly && (
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5 label-caps">
                <Equalizer playing={playing} color={playing ? GREEN : 'var(--c-fg3)'} />
                <TileTitle>{playing ? 'Spotify' : track ? 'Gepauzeerd' : 'Spotify'}</TileTitle>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={track?.id ?? 'none'} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25 }}>
                  <p className="truncate text-sm font-semibold text-fg">{track?.name ?? 'Er speelt niets'}</p>
                  <p className="truncate text-xs text-fg2">{track ? track.artists : 'Kies een apparaat om te beginnen'}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className={cn('flex shrink-0 items-center justify-center gap-3', compact ? 'mb-2' : 'mb-3')}>
          <Press onClick={() => void act(spotifyApi.previous)} disabled={!pb}
            className="flex h-9 w-9 items-center justify-center rounded-full text-fg2 hover:text-fg disabled:opacity-30">
            <SkipBack className="h-4 w-4 fill-current" />
          </Press>
          <Press onClick={() => void (playing ? act(spotifyApi.pause, { isPlaying: false }) : act(() => spotifyApi.play({}), { isPlaying: true }))} disabled={!pb}
            className={cn('flex items-center justify-center rounded-full bg-white text-zinc-950 disabled:opacity-40', compact ? 'h-10 w-10' : 'h-12 w-12')}
            style={{ boxShadow: '0 8px 24px -6px rgba(255,255,255,.35)' }}>
            {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-[1px] fill-current" />}
          </Press>
          <Press onClick={() => void act(spotifyApi.next)} disabled={!pb}
            className="flex h-9 w-9 items-center justify-center rounded-full text-fg2 hover:text-fg disabled:opacity-30">
            <SkipForward className="h-4 w-4 fill-current" />
          </Press>
        </div>

        {err && <p className="mb-1.5 line-clamp-2 shrink-0 text-center text-[11px] text-red-400">{err}</p>}

        {/* Spotify Connect devices */}
        <div className="flex min-h-0 flex-1 flex-col border-t border-subtle pt-2">
          <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
            <p className="truncate label-caps">Afspelen op</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => void refetchDevices()} className="rounded-md p-0.5 text-fg3 hover:text-fg2" title="Vernieuwen">
                <RefreshCw className={cn('h-3.5 w-3.5', loadingDevices && 'animate-spin')} />
              </button>
              <MusicSourceSwitch />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-hide">
            <ThisDeviceRow size="sm" activeId={pb?.device?.id} onPick={pick} />
            {(devices ?? []).filter(d => d.id !== browser.deviceId).map(d => {
              const Icon = deviceIcon(d.type)
              const active = d.id === pb?.device?.id
              return (
                <button key={d.id} onClick={() => pick(d.id)} disabled={d.restricted}
                  className={cn('relative flex w-full items-center gap-2 rounded-xl px-2.5 text-left text-xs font-medium transition-colors disabled:opacity-40',
                    compact ? 'py-1' : 'py-1.5', active ? 'text-black' : 'bg-card3 text-fg2 hover:text-fg')}>
                  {active && <motion.span layoutId="mini-spotify-device" transition={spring} className="absolute inset-0 rounded-xl" style={{ background: GREEN }} />}
                  <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" />
                  {!iconOnly && <span className="relative z-10 truncate">{d.name}</span>}
                </button>
              )
            })}
            {devices && devices.length === 0 && <p className="text-[11px] text-fg3">Geen apparaten — open Spotify op een speaker, telefoon of pc</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
