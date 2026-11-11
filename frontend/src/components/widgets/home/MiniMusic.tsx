import { useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { Play, Pause, SkipBack, SkipForward, Music, Headphones, Speaker, Settings2, Check, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { musicApi, audioApi, type MediaInfo, type AudioOutputDevice } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { queryClient as qc } from '@/lib/queryClient'
import { Press, spring } from '@/components/ui/motion'
import { useContainerSize, TileTitle } from './shared'
import { MiniSpotify } from '../music/MiniSpotify'

// ── Helpers (also used by the full Music tab) ────────────────────────────────
export function DeviceIcon({ name, className }: { name: string; className?: string }) {
  const n = name.toLowerCase()
  const cls = cn('h-3.5 w-3.5 shrink-0', className)
  return n.match(/headphone|headset|koptelefoon|arctis|nova|blackshark|steelseries|corsair|jabra|sennheiser|beyerdynamic|momentum|earphone|buds/)
    ? <Headphones className={cls} />
    : <Speaker className={cls} />
}

export function shortDeviceName(n: string) {
  return n.replace(/\s*\(.*?\)\s*/g, '').trim().split(' ').slice(0, 3).join(' ')
}

export function Equalizer({ playing, color = 'currentColor', className }: { playing: boolean; color?: string; className?: string }) {
  return (
    <span className={cn('inline-flex h-3 items-end gap-[2px]', className)} aria-hidden>
      {[0, 0.25, 0.1, 0.35].map((d, i) => (
        <span key={i} className={cn('w-[3px] rounded-full', playing && 'eq-bar')}
          style={{ height: '100%', background: color, animationDelay: `${d}s`, transform: playing ? undefined : 'scaleY(.3)', transformOrigin: 'bottom' }} />
      ))}
    </span>
  )
}

/** Blurred, slowly breathing album-art backdrop that cross-fades on track change. */
export function ArtBackdrop({ art, trackKey, intensity = 0.45 }: { art: string | null | undefined; trackKey: string; intensity?: number }) {
  return (
    <AnimatePresence initial={false}>
      {art && (
        <motion.div
          key={trackKey}
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: intensity }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <img src={art} alt="" className="h-full w-full scale-150 object-cover blur-3xl saturate-150" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function useMusicControls() {
  const inv = () => qc.invalidateQueries({ queryKey: ['music'] })
  const play  = useMutation({ mutationFn: musicApi.play,  onSuccess: inv })
  const pause = useMutation({ mutationFn: musicApi.pause, onSuccess: inv })
  const next  = useMutation({ mutationFn: musicApi.next,  onSuccess: inv })
  const prev  = useMutation({ mutationFn: musicApi.prev,  onSuccess: inv })
  const setOutput = useMutation({
    mutationFn: (id: string) => audioApi.setDefault(id),
    onMutate: (id: string) => {
      qc.setQueryData<AudioOutputDevice[]>(['audio', 'outputs'], old => old?.map(o => ({ ...o, isDefault: o.id === id })))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['audio', 'outputs'] }),
  })
  return { play, pause, next, prev, setOutput }
}

// ── Tile ──────────────────────────────────────────────────────────────────────
type Source = 'pc' | 'spotify'

/** Spotify logo mark (three arcs), sized like a lucide icon. */
function SpotifyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21Zm4.8 15.15a.65.65 0 0 1-.9.22c-2.47-1.5-5.57-1.85-9.23-1.01a.65.65 0 1 1-.29-1.27c4-.92 7.44-.52 10.2 1.17.31.19.4.59.22.89Zm1.28-2.86a.82.82 0 0 1-1.12.27c-2.82-1.74-7.13-2.24-10.47-1.23a.82.82 0 1 1-.47-1.56c3.82-1.16 8.57-.6 11.8 1.4.38.23.5.74.26 1.12Zm.11-2.97C14.8 8.8 9.2 8.6 5.96 9.6a.98.98 0 1 1-.57-1.88c3.72-1.13 9.9-.91 13.8 1.4a.98.98 0 0 1-1 1.7Z" />
    </svg>
  )
}

/** Small pc ⇄ Spotify switch (shared with the Muziek tab via localStorage). */
export function MusicSourceSwitch() {
  const [source, setSource] = useLocalStorage<Source>('music-source', 'pc')
  return (
    <div className="flex shrink-0 gap-0.5 rounded-lg bg-card3 p-0.5">
      {([['pc', 'Media van deze pc', Monitor], ['spotify', 'Spotify', SpotifyMark]] as const).map(([id, title, Icon]) => (
        <button key={id} onClick={() => setSource(id)} title={title} aria-pressed={source === id}
          className={cn('relative rounded-md px-1.5 py-1 transition-colors', source === id ? 'text-fg' : 'text-fg3 hover:text-fg2')}>
          {source === id && <motion.span layoutId="mini-music-source" transition={spring} className="absolute inset-0 rounded-md"
            style={{ background: id === 'spotify' ? '#1ed76033' : 'var(--c-card4, rgba(255,255,255,.12))' }} />}
          <Icon className={cn('relative z-10 h-3.5 w-3.5', id === 'spotify' && source === id && 'text-[#1ed760]')} />
        </button>
      ))}
    </div>
  )
}

/** Music tile: this pc's media/audio outputs or Spotify. */
export function MiniMusic() {
  const [source] = useLocalStorage<Source>('music-source', 'pc')
  return source === 'spotify' ? <MiniSpotify /> : <MiniPcMusic />
}

function MiniPcMusic() {
  const ref = useRef<HTMLDivElement>(null)
  const { h, w } = useContainerSize(ref)

  const { data } = useQuery<MediaInfo>({ queryKey: ['music'], queryFn: musicApi.getCurrent, refetchInterval: 5_000 })
  const { data: outputs = [] } = useQuery<AudioOutputDevice[]>({ queryKey: ['audio', 'outputs'], queryFn: audioApi.getOutputs, staleTime: 30_000 })
  const [hiddenIds, setHiddenIds] = useLocalStorage<string[]>('audio-hidden-outputs', [])
  const [editOutputs, setEditOutputs] = useState(false)
  const { play, pause, next, prev, setOutput } = useMusicControls()

  const isPlaying   = data?.playbackStatus === 'Playing'
  const visibleOuts = outputs.filter(o => !hiddenIds.includes(o.id))
  const toggleHide  = (id: string) => setHiddenIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const trackKey    = `${data?.title}-${data?.artist}`

  const compact  = h < 280
  const iconOnly = w > 0 && w < 190
  const artSize  = compact ? 44 : Math.min(Math.max(h * 0.28, 64), 120, w > 0 ? w * 0.3 : 120)

  return (
    <div ref={ref} className="relative flex h-full flex-col overflow-hidden">
      <ArtBackdrop art={data?.albumArtDataUrl} trackKey={trackKey} intensity={0.4} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--c-solid)] opacity-60" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-4">
        {/* Now playing */}
        <div className={cn('flex shrink-0 items-center gap-3', compact ? 'mb-2' : 'mb-3')}>
          <motion.div
            className="relative shrink-0 overflow-hidden rounded-2xl bg-card4"
            style={{ width: artSize, height: artSize, boxShadow: '0 12px 30px -10px rgba(0,0,0,.6)' }}
            animate={{ scale: isPlaying ? 1 : 0.94 }}
            transition={spring}
          >
            <AnimatePresence initial={false}>
              {data?.albumArtDataUrl ? (
                <motion.img key={trackKey} src={data.albumArtDataUrl} alt=""
                  initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center"><Music className="h-5 w-5 text-fg3" /></div>
              )}
            </AnimatePresence>
          </motion.div>
          {!iconOnly && (
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5 label-caps">
                <Equalizer playing={isPlaying} color={isPlaying ? '#34d399' : 'var(--c-fg3)'} />
                <TileTitle>{isPlaying ? 'Speelt nu' : data?.title ? 'Gepauzeerd' : 'Muziek'}</TileTitle>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={trackKey}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.25 }}>
                  <p className="truncate text-sm font-semibold text-fg">{data?.title ?? 'Geen media actief'}</p>
                  {data?.artist && <p className="truncate text-xs text-fg2">{data.artist}</p>}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className={cn('flex shrink-0 items-center justify-center gap-3', compact ? 'mb-2' : 'mb-3')}>
          <Press onClick={() => prev.mutate()} disabled={!data?.canSkipPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full text-fg2 hover:text-fg disabled:opacity-30">
            <SkipBack className="h-4 w-4 fill-current" />
          </Press>
          <Press onClick={() => isPlaying ? pause.mutate() : play.mutate()}
            disabled={isPlaying ? !data?.canPause : !data?.canPlay}
            className={cn('flex items-center justify-center rounded-full bg-white text-zinc-950 disabled:opacity-40',
              compact ? 'h-10 w-10' : 'h-12 w-12')}
            style={{ boxShadow: '0 8px 24px -6px rgba(255,255,255,.35)' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={isPlaying ? 'p' : 'r'} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.15 }}>
                {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-[1px] fill-current" />}
              </motion.span>
            </AnimatePresence>
          </Press>
          <Press onClick={() => next.mutate()} disabled={!data?.canSkipNext}
            className="flex h-9 w-9 items-center justify-center rounded-full text-fg2 hover:text-fg disabled:opacity-30">
            <SkipForward className="h-4 w-4 fill-current" />
          </Press>
        </div>

        {/* Audio outputs (+ source switch) */}
        {outputs.length === 0 && <div className="mt-auto flex shrink-0 justify-end"><MusicSourceSwitch /></div>}
        {outputs.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col border-t border-subtle pt-2">
            <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
              <p className="truncate label-caps">Uitvoer</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setEditOutputs(e => !e)} title="Uitvoer kiezen"
                  className={cn('rounded-md p-0.5 transition-colors', editOutputs ? 'text-orange-400' : 'text-fg3 hover:text-fg2')}>
                  {editOutputs ? <Check className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
                </button>
                <MusicSourceSwitch />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-hide">
              {editOutputs
                ? outputs.map(o => (
                    <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-card3">
                      <input type="checkbox" checked={!hiddenIds.includes(o.id)} onChange={() => toggleHide(o.id)} className="accent-orange-500" />
                      <span className="truncate text-xs text-fg2">{shortDeviceName(o.name)}</span>
                    </label>
                  ))
                : visibleOuts.map(o => (
                    <button key={o.id} onClick={() => setOutput.mutate(o.id)}
                      className={cn(
                        'relative flex w-full items-center gap-2 rounded-xl px-2.5 text-left text-xs font-medium transition-colors',
                        compact ? 'py-1' : 'py-1.5',
                        o.isDefault ? 'text-white' : 'bg-card3 text-fg2 hover:text-fg',
                      )}>
                      {o.isDefault && <motion.span layoutId="mini-output" transition={spring} className="absolute inset-0 rounded-xl bg-accent" />}
                      <DeviceIcon name={o.name} className="relative z-10" />
                      {!iconOnly && <span className="relative z-10 truncate">{shortDeviceName(o.name)}</span>}
                    </button>
                  ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
