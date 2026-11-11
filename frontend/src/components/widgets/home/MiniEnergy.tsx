import { useRef } from 'react'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  useEnergyPrices, useEnergyUsage, ELEC_COLOR, formatEur, formatPrice, formatNum,
  hourLabel, localDay, priceAt, pricesOfDay, cheapestWindow, extremes,
} from '@/lib/energy'
import { BarChart } from '@/components/ui/BarChart'
import { EmptyState, Skeleton } from '@/components/ui/motion'
import { useContainerSize, TileHeader } from './shared'
import { ENERGY_VISIBLE_KEY, type EnergyItem } from './TileConfig'

export function MiniEnergy() {
  const ref = useRef<HTMLDivElement>(null)
  const { h, w } = useContainerSize(ref)
  const narrow = w > 0 && w < 300
  const { data: prices, isLoading, isError } = useEnergyPrices()
  const { data: usage } = useEnergyUsage()
  const [visible] = useLocalStorage<string[]>(ENERGY_VISIBLE_KEY, [])
  const want = (id: EnergyItem) => visible.length === 0 || visible.includes(id)
  const now = new Date()

  const today   = prices ? pricesOfDay(prices.electricity, localDay(now)) : []
  const cur     = prices ? priceAt(prices.electricity, now) : undefined
  const gas     = prices ? priceAt(prices.gas, now) : undefined
  const best    = prices ? cheapestWindow(prices.electricity, 3, now) : null
  const avg     = today.length ? today.reduce((s, p) => s + p.total, 0) / today.length : 0
  const usageOk = !!usage?.configured && !usage.error
  const lastDay = usageOk ? usage!.days.at(-1) : undefined
  const month   = usageOk ? usage!.month : null

  // Fixed-height rows first (h is the content height inside the padding; header ≈ 40)
  let free = h - 40
  const showPrice    = want('price') && !!cur
  const showCheapest = want('cheapest') && !!best
  if (showPrice || showCheapest) free -= showPrice && showCheapest && narrow ? 100 : 56
  const showGasRow   = want('gas') && !!gas && !showPrice // with the price row, gas sits in the header
  if (showGasRow) free -= 32
  const ext          = extremes(today)
  const showExtremes = want('extremes') && !!ext && free >= 40
  if (showExtremes) free -= 40
  const showMonth    = want('month') && !!month && free >= 36
  if (showMonth) free -= 36
  const showUsage    = want('usage') && !!lastDay && free >= 36
  if (showUsage) free -= 36
  const showChart    = want('chart') && today.length > 0 && free >= 70
  const chartH       = Math.max(36, Math.min(120, free - 44)) // 32 tooltip room + gap

  return (
    <div ref={ref} className="flex h-full flex-col p-4">
      <TileHeader icon={<Zap />} title="Energie"
        right={want('gas') && gas && showPrice && <span className="text-[11px] text-fg3 tabular">gas {formatPrice(gas.total)}</span>} />

      {isLoading ? (
        <Skeleton className="h-16" />
      ) : isError || !prices ? (
        <EmptyState icon={<Zap className="h-5 w-5" />} title="Prijzen niet beschikbaar" />
      ) : (
        <>
          {(showPrice || showCheapest) && (
            <div className={cn('flex shrink-0 justify-between gap-2', narrow ? 'flex-col' : 'items-end')}>
              {showPrice && cur && (
                <div className="min-w-0">
                  <p className={cn('font-semibold tracking-[-0.03em] text-fg tabular', narrow ? 'text-2xl' : 'text-3xl')}>{formatPrice(cur.total)}</p>
                  <p className={cn('truncate text-xs', cur.total <= avg ? 'text-emerald-400' : 'text-orange-400')}>
                    per kWh · {cur.total <= avg ? 'onder' : 'boven'} gem.
                  </p>
                </div>
              )}
              {showCheapest && best && (
                <div className={cn('shrink-0', showPrice && !narrow ? 'text-right' : '')}>
                  <p className="label-caps">Goedkoopst (3 uur)</p>
                  <p className={cn('font-semibold text-fg tabular', showPrice ? 'text-sm' : 'text-2xl')}>
                    {hourLabel(best.start.from)}–{hourLabel(best.end.till)}
                  </p>
                </div>
              )}
            </div>
          )}

          {showGasRow && gas && (
            <div className="mt-2 flex shrink-0 items-baseline justify-between text-sm">
              <span className="text-fg3">Gas vandaag</span>
              <span className="font-semibold text-fg tabular">{formatPrice(gas.total)} <span className="text-xs font-normal text-fg3">/m³</span></span>
            </div>
          )}

          {showExtremes && ext && (
            <div className="mt-2 grid shrink-0 grid-cols-2 gap-1.5 text-xs tabular">
              <div className="rounded-xl bg-card3 px-2.5 py-1.5">
                <span className="text-emerald-400">▼</span> <span className="text-fg3">laagst</span>{' '}
                <b className="text-fg">{hourLabel(ext.low.from)}</b>
              </div>
              <div className="rounded-xl bg-card3 px-2.5 py-1.5">
                <span className="text-orange-400">▲</span> <span className="text-fg3">hoogst</span>{' '}
                <b className="text-fg">{hourLabel(ext.high.from)}</b>
              </div>
            </div>
          )}

          {showChart ? (
            <div className="mt-2 flex min-h-0 flex-1 flex-col justify-end pt-8">
              <BarChart compact color={ELEC_COLOR} height={chartH}
                bars={today.map(p => ({
                  key: p.from, value: p.total,
                  tone: p === cur ? 'current' : new Date(p.till) <= now ? 'muted' : 'normal',
                  tooltip: <span>{hourLabel(p.from)} · <b>{formatPrice(p.total)}</b></span>,
                }))} />
            </div>
          ) : <div className="flex-1" />}

          {showMonth && month && (
            <div className="mt-2 flex shrink-0 items-baseline justify-between border-t border-subtle pt-2.5 text-xs text-fg2 tabular">
              <span className="text-fg3">Deze maand</span>
              <span>verwacht {formatEur(month.expectedCostsSoFar)}</span>
              <span className="font-semibold text-fg">{formatEur(month.actualCosts)}</span>
            </div>
          )}

          {showUsage && lastDay && (
            <div className="mt-2 flex shrink-0 justify-between border-t border-subtle pt-2.5 text-xs text-fg2 tabular">
              <span className="text-fg3">{new Date(lastDay.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })}</span>
              <span>{formatNum(lastDay.electricityKwh)} kWh · {formatNum(lastDay.gasM3)} m³</span>
              <span className="font-semibold text-fg">{formatEur(lastDay.electricityCost + lastDay.gasCost)}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
