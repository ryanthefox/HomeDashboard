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
