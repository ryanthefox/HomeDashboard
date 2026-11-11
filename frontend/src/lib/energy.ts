import { useQuery } from '@tanstack/react-query'
import { energyApi, type EnergyPrice, type EnergyPrices, type EnergyUsage } from '@/lib/api'

export const ELEC_COLOR = '#fbbf24' // stroom
export const GAS_COLOR  = '#60a5fa' // gas

export function useEnergyPrices() {
  return useQuery<EnergyPrices>({
    queryKey: ['energy', 'prices'], queryFn: energyApi.getPrices,
    staleTime: 10 * 60_000, refetchInterval: 15 * 60_000,
  })
}

export function useEnergyUsage() {
  return useQuery<EnergyUsage>({
    queryKey: ['energy', 'usage'], queryFn: energyApi.getUsage,
    staleTime: 30 * 60_000, refetchInterval: 60 * 60_000,
  })
}

const eur = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })
export const formatEur = (v: number) => eur.format(v)
/** Unit price with 3 decimals, e.g. € 0,389 */
export const formatPrice = (v: number) => `€ ${v.toFixed(3).replace('.', ',')}`
export const formatNum = (v: number, digits = 1) => v.toLocaleString('nl-NL', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const hourLabel = (iso: string) => new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
export const dayLabel  = (iso: string) => new Date(iso).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

/** Local yyyy-mm-dd of an ISO timestamp. */
export function localDay(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function priceAt(prices: EnergyPrice[], at = new Date()): EnergyPrice | undefined {
  const t = at.getTime()
  return prices.find(p => new Date(p.from).getTime() <= t && t < new Date(p.till).getTime())
}

/** Prices of one local calendar day. */
export const pricesOfDay = (prices: EnergyPrice[], day: string) => prices.filter(p => localDay(p.from) === day)

/** Cheapest consecutive window of `hours` slots that hasn't ended yet. */
export function cheapestWindow(prices: EnergyPrice[], hours = 3, now = new Date()) {
  const future = prices.filter(p => new Date(p.till).getTime() > now.getTime())
  let best: { start: EnergyPrice; end: EnergyPrice; avg: number } | null = null
  for (let i = 0; i + hours <= future.length; i++) {
    const slice = future.slice(i, i + hours)
    const avg = slice.reduce((s, p) => s + p.total, 0) / hours
    if (!best || avg < best.avg) best = { start: slice[0], end: slice[hours - 1], avg }
  }
  return best
}
