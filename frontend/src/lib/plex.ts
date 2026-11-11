import type { PlexItem, PlexSession } from '@/lib/api'

/** "S02E05 · Show" for episodes, the year for movies. */
export function plexMeta(item: PlexItem | PlexSession): string | null {
  if (item.type !== 'episode') return 'year' in item && item.year ? String(item.year) : null
  const s = item.season  != null ? `S${String(item.season).padStart(2, '0')}`  : ''
  const e = item.episode != null ? `E${String(item.episode).padStart(2, '0')}` : ''
  return [s + e, item.showTitle].filter(Boolean).join(' · ') || null
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}u ${m}m` : `${m}m`
}

/** Link that opens an item in Plex Web (the Plex app takes over on phones/tablets when installed). */
export function plexUrl(machineId: string | null | undefined, ratingKey: string): string | undefined {
  if (!machineId || !ratingKey) return undefined
  return `https://app.plex.tv/desktop/#!/server/${machineId}/details?key=${encodeURIComponent(`/library/metadata/${ratingKey}`)}`
}

/** Fraction watched (0–1), or null when not started / already finished. */
export function plexProgress(item: { viewOffset: number; duration: number }): number | null {
  if (!item.duration || item.viewOffset <= 0) return null
  const p = item.viewOffset / item.duration
  return p >= 0.98 ? null : p
}

export const DECISION_LABEL = {
  directplay:   { label: 'Direct afspelen', tone: 'text-emerald-400 bg-emerald-500/15' },
  directstream: { label: 'Direct stream',   tone: 'text-sky-400 bg-sky-500/15' },
  transcode:    { label: 'Transcoderen',    tone: 'text-amber-400 bg-amber-500/15' },
} as const

export function formatBandwidth(kbps: number | null): string | null {
  if (!kbps) return null
  return kbps >= 1000 ? `${(kbps / 1000).toFixed(1)} Mbps` : `${kbps} kbps`
}
