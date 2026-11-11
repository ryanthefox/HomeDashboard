import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tv } from 'lucide-react'
import { cn } from '@/lib/utils'
import { plexApi, type PlexStats } from '@/lib/api'
import { plexUrl } from '@/lib/plex'

export function usePlexStats() {
  return useQuery<PlexStats | null>({
    queryKey: ['plex', 'stats'], queryFn: plexApi.getStats, refetchInterval: 10 * 60_000, staleTime: 5 * 60_000,
  })
}

/** Wraps children in a link to the item in Plex when the server id is known. */
export function PlexLink({ ratingKey, className, children }: { ratingKey: string; className?: string; children: ReactNode }) {
  const { data: stats } = usePlexStats()
  const href = plexUrl(stats?.machineId, ratingKey)
  if (!href) return <div className={className}>{children}</div>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn('block cursor-pointer', className)}>
      {children}
    </a>
  )
}

/** Thin orange watch-progress bar. */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1 overflow-hidden rounded-full bg-[var(--c-track)]', className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-1000"
        style={{ width: `${Math.min(100, Math.max(2, value * 100))}%` }} />
    </div>
  )
}

/** Poster image with fallback icon and optional progress bar along the bottom edge. */
export function PlexPoster({ src, progress, className, rounded = 'rounded-lg', height }: {
  src: string | null; progress?: number | null; className?: string; rounded?: string; height?: number
}) {
  const [error, setError] = useState(false)
  return (
    <div className={cn('relative shrink-0 overflow-hidden bg-card4', rounded, className)}
      style={{ height, boxShadow: '0 8px 20px -8px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.05)' }}>
      {src && !error
        ? <img src={src} alt="" loading="lazy" onError={() => setError(true)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        : <div className="flex h-full w-full items-center justify-center"><Tv className="h-1/4 w-1/4 text-fg3" /></div>}
      {progress != null && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
          <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.max(3, progress * 100)}%` }} />
        </div>
      )}
    </div>
  )
}

/** "vandaag", "gisteren", "3 dagen geleden", or a short date. */
export function addedAgo(unixSeconds: number): string | null {
  if (!unixSeconds) return null
  const days = Math.floor((Date.now() / 1000 - unixSeconds) / 86400)
  if (days <= 0) return 'vandaag'
  if (days === 1) return 'gisteren'
  if (days < 7) return `${days} dagen geleden`
  return new Date(unixSeconds * 1000).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}
