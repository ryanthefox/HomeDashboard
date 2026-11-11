import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { travelApi, type TravelData, type TravelDirection } from '@/lib/api'

/** Mornings you go to work, afternoons back home — unless you tap the other way. */
const autoDirection = (): TravelDirection => (new Date().getHours() < 12 ? 'work' : 'home')

export function useTravelDirection() {
  const [manual, setManual] = useState<{ dir: TravelDirection; at: number } | null>(null)
  const [, force] = useState(0)
  useEffect(() => { const t = setInterval(() => force(x => x + 1), 5 * 60_000); return () => clearInterval(t) }, [])
  // A manual choice holds for an hour, then it follows the clock again
  const dir = manual && Date.now() - manual.at < 60 * 60_000 ? manual.dir : autoDirection()
  return [dir, (d: TravelDirection) => setManual({ dir: d, at: Date.now() })] as const
}

export function useTravel(dir: TravelDirection) {
  return useQuery<TravelData>({
    queryKey: ['travel', dir], queryFn: () => travelApi.get(dir),
    staleTime: 60_000, refetchInterval: 2 * 60_000,
  })
}

export const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

export const delayColor = (min: number) => (min >= 10 ? '#f87171' : min >= 3 ? '#fbbf24' : '#34d399')

export function formatMinutes(min: number) {
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}u ${String(min % 60).padStart(2, '0')}`
}
