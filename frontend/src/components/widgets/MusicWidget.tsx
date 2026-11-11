import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { Play, Pause, SkipBack, SkipForward, Music, Music2, Monitor, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { musicApi, audioApi, type MediaInfo, type AudioOutputDevice } from '@/lib/api'
import { Panel, Press, Segmented, Skeleton, spring, easeOutExpo } from '@/components/ui/motion'
import { ArtBackdrop, DeviceIcon, Equalizer, useMusicControls } from './home/MiniMusic'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { SpotifyView } from './music/SpotifyView'

function LocalMusic() {
  const { data, isLoading } = useQuery<MediaInfo>({ queryKey: ['music'], queryFn: musicApi.getCurrent, refetchInterval: 5_000 })
  const { data: outputs = [] } = useQuery<AudioOutputDevice[]>({ queryKey: ['audio', 'outputs'], queryFn: audioApi.getOutputs, staleTime: 30_000 })
  const { play, pause, next, prev, setOutput } = useMusicControls()

  const isPlaying = data?.playbackStatus === 'Playing'
  const hasMedia  = !!(data?.title || data?.artist)
  const trackKey  = `${data?.title}-${data?.artist}`

  if (isLoading) {
    return <div className="mx-auto max-w-md space-y-3"><Skeleton className="aspect-square rounded-3xl" /><Skeleton className="h-20 rounded-3xl" /></div>
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 pb-4 md:flex-row md:items-stretch">
        {/* Now playing */}
        <Panel className="relative flex-1 overflow-hidden">
          <ArtBackdrop art={data?.albumArtDataUrl} trackKey={trackKey} intensity={0.55} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--c-solid)] opacity-70" />

          <div className="relative flex flex-col items-center px-6 pb-8 pt-8 sm:px-10">
            {/* Album art with glow + gentle breathing while playing */}
            <motion.div
              className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-[28px] bg-card4"
              animate={{ scale: isPlaying ? 1 : 0.92 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.06)' }}
            >
              <AnimatePresence initial={false}>
                {data?.albumArtDataUrl ? (
                  <motion.img key={trackKey} src={data.albumArtDataUrl} alt="Album art"
                    initial={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: easeOutExpo }}
                    className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Music className="h-16 w-16 text-fg3" />
                  </div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Track info */}
            <div className="mt-7 w-full max-w-[360px] text-center">
              <div className="mb-2 flex items-center justify-center gap-2 label-caps">
                <Equalizer playing={isPlaying} color={isPlaying ? '#34d399' : 'var(--c-fg3)'} />
                {isPlaying ? 'Speelt nu' : hasMedia ? 'Gepauzeerd' : 'Geen media actief'}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={trackKey}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}>
                  <p className="truncate text-2xl font-semibold tracking-tight text-fg">{data?.title ?? '—'}</p>
                  <p className="mt-1 truncate text-sm text-fg2">{data?.artist ?? ''}</p>
                  {data?.albumTitle && <p className="mt-0.5 truncate text-xs text-fg3">{data.albumTitle}</p>}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="mt-7 flex items-center justify-center gap-6">
              <Press disabled={!data?.canSkipPrev} onClick={() => prev.mutate()}
                className="flex h-12 w-12 items-center justify-center rounded-full text-fg2 hover:text-fg disabled:opacity-30">
                <SkipBack className="h-6 w-6 fill-current" />
              </Press>
              <Press
                disabled={isPlaying ? !data?.canPause : !data?.canPlay}
                onClick={() => isPlaying ? pause.mutate() : play.mutate()}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-zinc-950 disabled:opacity-40"
                style={{ boxShadow: '0 12px 36px -8px rgba(255,255,255,.45)' }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={isPlaying ? 'p' : 'r'}
                    initial={{ scale: 0.3, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.3, opacity: 0, rotate: 30 }}
                    transition={{ duration: 0.18 }}>
                    {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 translate-x-0.5 fill-current" />}
                  </motion.span>
                </AnimatePresence>
              </Press>
              <Press disabled={!data?.canSkipNext} onClick={() => next.mutate()}
                className="flex h-12 w-12 items-center justify-center rounded-full text-fg2 hover:text-fg disabled:opacity-30">
                <SkipForward className="h-6 w-6 fill-current" />
              </Press>
            </div>
          </div>
        </Panel>

        {/* Audio output selector */}
        {outputs.length > 0 && (
          <Panel index={1} className="p-5 md:w-80">
            <div className="mb-4 flex items-center gap-2 label-caps">
              <Volume2 className="h-3.5 w-3.5" />Audio uitvoer
            </div>
            <div className="flex flex-col gap-1.5">
              {outputs.map((o, i) => (
                <motion.button
                  key={o.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setOutput.mutate(o.id)}
                  className={cn('relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors',
                    o.isDefault ? 'text-white' : 'bg-card3 text-fg2 hover:text-fg')}
                >
                  {o.isDefault && <motion.span layoutId="music-output" transition={spring} className="absolute inset-0 rounded-2xl bg-accent" />}
                  <DeviceIcon name={o.name} className="relative z-10 h-4 w-4" />
                  <span className="relative z-10 flex-1 truncate">{o.name}</span>
                  {o.isDefault && <span className="relative z-10 h-2 w-2 rounded-full bg-white shadow-[0_0_8px_white]" />}
                </motion.button>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}

type Source = 'pc' | 'spotify'

export function MusicWidget() {
  const [source, setSource] = useLocalStorage<Source>('music-source', 'pc')
  // Back from the Spotify login (?spotify=ok|error) -> open the Spotify tab and tidy the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('spotify')) return
    setSource('spotify')
    params.delete('spotify')
    const qs = params.toString()
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      <Segmented layoutId="music-source" value={source} onChange={setSource} className="self-start" items={[
        { id: 'pc', label: <span className="flex items-center gap-1.5"><Monitor className="h-4 w-4" />Deze pc</span> },
        { id: 'spotify', label: <span className="flex items-center gap-1.5"><Music2 className="h-4 w-4" />Spotify</span> },
      ]} />
      {source === 'spotify' ? <SpotifyView /> : <LocalMusic />}
    </div>
  )
}
