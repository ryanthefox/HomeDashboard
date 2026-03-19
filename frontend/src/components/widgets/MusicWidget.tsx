import { useQuery, useMutation } from '@tanstack/react-query'
import { Play, Pause, SkipBack, SkipForward, Music, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { musicApi, audioApi, type MediaInfo, type AudioOutputDevice } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

export function MusicWidget() {
  const { data, isLoading } = useQuery<MediaInfo>({
    queryKey: ['music'],
    queryFn: musicApi.getCurrent,
    refetchInterval: 5_000,
  })

  const { data: outputs = [] } = useQuery<AudioOutputDevice[]>({
    queryKey: ['audio', 'outputs'],
    queryFn: audioApi.getOutputs,
    staleTime: 30_000,
  })

  const play  = useMutation({ mutationFn: musicApi.play,  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['music'] }) })
  const pause = useMutation({ mutationFn: musicApi.pause, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['music'] }) })
  const next  = useMutation({ mutationFn: musicApi.next,  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['music'] }) })
  const prev  = useMutation({ mutationFn: musicApi.prev,  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['music'] }) })

  const setOutput = useMutation({
    mutationFn: (id: string) => audioApi.setDefault(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audio', 'outputs'] }),
  })

  const isPlaying = data?.playbackStatus === 'Playing'
  const hasMedia  = data?.title || data?.artist

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-zinc-500">Laden…</div>
  }

  return (
    <div className="mx-auto max-w-md space-y-3">

      {/* Now playing card */}
      {!hasMedia ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-card py-16">
          <Music className="h-12 w-12 text-zinc-700" />
          <p className="text-sm text-zinc-500">Geen media actief</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-card">
          {/* Album art */}
          <div className="relative">
            {data?.albumArtDataUrl ? (
              <img src={data.albumArtDataUrl} alt="Album art" className="h-64 w-full object-cover" />
            ) : (
              <div className="flex h-64 w-full items-center justify-center bg-elev">
                <Music className="h-16 w-16 text-zinc-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
          </div>

          {/* Track info + controls */}
          <div className="px-6 pb-7 pt-2">
            <p className="text-xl font-bold text-fg">{data?.title ?? '—'}</p>
            <p className="mt-0.5 text-sm text-zinc-400">{data?.artist ?? '—'}</p>
            {data?.albumTitle && (
              <p className="mt-0.5 text-xs text-zinc-600">{data.albumTitle}</p>
            )}

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                disabled={!data?.canSkipPrev || prev.isPending}
                onClick={() => prev.mutate()}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition hover:text-fg disabled:opacity-30"
              >
                <SkipBack className="h-5 w-5" />
              </button>

              <button
                disabled={(isPlaying ? !data?.canPause : !data?.canPlay)}
                onClick={() => isPlaying ? pause.mutate() : play.mutate()}
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-full transition-all',
                  'bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.2)] hover:scale-105 disabled:opacity-40'
                )}
              >
                {isPlaying
                  ? <Pause className="h-6 w-6" />
                  : <Play  className="h-6 w-6 translate-x-0.5" />
                }
              </button>

              <button
                disabled={!data?.canSkipNext || next.isPending}
                onClick={() => next.mutate()}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition hover:text-fg disabled:opacity-30"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio output selector */}
      {outputs.length > 0 && (
        <div className="rounded-2xl bg-card px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-zinc-500" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Audio uitvoer</p>
          </div>
          <select
            value={outputs.find(o => o.isDefault)?.id ?? ''}
            onChange={e => setOutput.mutate(e.target.value)}
            disabled={setOutput.isPending}
            className="w-full rounded-xl bg-elev2 px-3 py-2.5 text-sm text-zinc-200 outline-none border-0 cursor-pointer disabled:opacity-50"
          >
            {outputs.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
