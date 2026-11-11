import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { MonitorSmartphone, Loader2, ExternalLink, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { spotifyApi, type SpotifyStatus } from '@/lib/api'
import { activateBrowserPlayer, startBrowserPlayer, useBrowserPlayer, isMobileDevice } from '@/lib/spotifyPlayer'
import { spring } from '@/components/ui/motion'

const GREEN = '#1ed760'

/** Starts the in-browser Spotify player when the login allows it; returns its state. */
export function useThisDevicePlayer() {
  const qc = useQueryClient()
  const { data: status } = useQuery<SpotifyStatus>({ queryKey: ['spotify', 'status'], queryFn: spotifyApi.status, staleTime: 60_000 })
  const canStream = !!status?.connected && !!status.canStream
  useEffect(() => {
    if (canStream) void startBrowserPlayer(() => void qc.invalidateQueries({ queryKey: ['spotify', 'devices'] }))
  }, [canStream, qc])
  return { player: useBrowserPlayer(), canStream, connected: !!status?.connected, httpsUrl: status?.httpsUrl ?? null }
}

function blockerText(message: string | null, canStream: boolean): { text: string; app: boolean } {
  if (!canStream) return { text: 'Koppel Spotify opnieuw (Muziek-tab) om dit aan te zetten', app: false }
  switch (message) {
    case 'insecure': return { text: 'Spotify staat dit alleen toe via https (of op de pc zelf via localhost)', app: isMobileDevice() }
    case 'mobile':   return { text: 'Spotify ondersteunt de browser niet op telefoon/tablet — open de app, dan verschijnt dit apparaat in de lijst', app: true }
    default:         return { text: message && message !== 'nodrm' ? message : 'Deze browser kan Spotify niet zelf afspelen', app: isMobileDevice() }
  }
}

/** "This device" entry for the Spotify device lists. */
export function ThisDeviceRow({ activeId, onPick, size = 'md' }: {
  activeId: string | null | undefined; onPick: (deviceId: string) => void; size?: 'sm' | 'md'
}) {
  const { player, canStream, connected, httpsUrl } = useThisDevicePlayer()
  if (!connected) return null
  const sm = size === 'sm'
  const ready = player.status === 'ready' && !!player.deviceId
  const active = ready && activeId === player.deviceId

  if (ready) {
    return (
      <button onClick={() => { activateBrowserPlayer(); onPick(player.deviceId!) }}
        className={cn('relative flex w-full items-center gap-2.5 text-left transition-colors',
          sm ? cn('gap-2 rounded-xl px-2.5 text-xs font-medium py-1.5', active ? 'text-black' : 'bg-card3 text-fg2 hover:text-fg')
             : cn('rounded-2xl px-3 py-3', active ? 'bg-card4' : 'hover:bg-card3'))}>
        {sm && active && <motion.span layoutId="mini-spotify-device" transition={spring} className="absolute inset-0 rounded-xl" style={{ background: GREEN }} />}
        {sm ? <MonitorSmartphone className="relative z-10 h-3.5 w-3.5 shrink-0" /> : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card3" style={active ? { color: GREEN } : undefined}>
            <MonitorSmartphone className="h-4 w-4" />
          </span>
        )}
        <span className="relative z-10 min-w-0 flex-1">
          <span className={cn('block truncate', !sm && 'text-sm font-medium')} style={!sm && active ? { color: GREEN } : undefined}>Dit apparaat</span>
          {!sm && <span className="block text-[11px] text-fg3">{active ? 'Speelt hier' : 'Afspelen via deze browser'}</span>}
        </span>
        {!sm && active && <Check className="h-4 w-4 shrink-0" style={{ color: GREEN }} />}
      </button>
    )
  }

  if (player.status === 'loading' || (player.status === 'idle' && canStream)) {
    return (
      <div className={cn('flex items-center gap-2 text-fg3', sm ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-3 text-sm')}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Dit apparaat klaarzetten…
      </div>
    )
  }

  const { text, app } = blockerText(player.message, canStream)
  const goHttps = canStream && player.message === 'insecure' && !!httpsUrl
  if (sm && !app && !goHttps) return null // the small tile only shows actionable hints
  return (
    <div className={cn('flex items-start gap-2.5 rounded-2xl text-fg3', sm ? 'px-2.5 py-1.5 text-[11px]' : 'bg-card3/50 px-3 py-2.5 text-xs')}>
      {!sm && <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0" />}
      <div className="min-w-0 flex-1">
        {!sm && <p className="font-medium text-fg2">Dit apparaat</p>}
        {!sm && <p className="leading-relaxed">{text}</p>}
        {goHttps && (
          <a href={`${httpsUrl}/?tab=muziek`} className="mt-1 inline-flex items-center gap-1 font-medium hover:text-fg" style={{ color: GREEN }}>
            <ExternalLink className="h-3 w-3" /> Open het dashboard via https
          </a>
        )}
        {app && !goHttps && (
          <a href="spotify:" className="mt-1 inline-flex items-center gap-1 font-medium hover:text-fg" style={{ color: GREEN }}>
            <ExternalLink className="h-3 w-3" /> Spotify-app openen op dit apparaat
          </a>
        )}
      </div>
    </div>
  )
}
