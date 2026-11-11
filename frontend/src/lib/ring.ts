import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ringApi, type RingStatus, type RingLiveEvent } from '@/lib/api'

export const RING_MOTION_ALERT_KEY = 'ring-motion-alerts'

export function useRingStatus() {
  return useQuery<RingStatus>({
    queryKey: ['ring', 'status'], queryFn: ringApi.getStatus,
    staleTime: 20_000, refetchInterval: 60_000,
  })
}

// ── Live events (doorbell / motion), fed by SignalR in useSignalR ─────────────
type Listener = (e: RingLiveEvent) => void
const listeners = new Set<Listener>()

export function emitRingEvent(e: RingLiveEvent) { listeners.forEach(l => l(e)) }
export function onRingEvent(l: Listener) { listeners.add(l); return () => { listeners.delete(l) } }

/** Increments on every event for a camera — use as a cache-buster for its snapshot. */
export function useRingEventTick(cameraId?: string) {
  const [tick, setTick] = useState(0)
  useEffect(() => onRingEvent(e => { if (!cameraId || e.cameraId === cameraId) setTick(t => t + 1) }), [cameraId])
  return tick
}

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'zojuist'
  if (s < 3600) return `${Math.floor(s / 60)} min geleden`
  if (s < 86_400) return `${Math.floor(s / 3600)} uur geleden`
  return new Date(iso).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export const eventLabel = (kind: string) =>
  kind === 'ding' ? 'Aangebeld' : kind === 'motion' ? 'Beweging' : kind === 'on_demand' ? 'Live bekeken' : kind
