import { useState } from 'react'
import { motion } from 'motion/react'
import { Zap, Flame, Wallet, Clock, Info, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EnergyPrice, EnergyUsagePoint } from '@/lib/api'
import {
  useEnergyPrices, useEnergyUsage, ELEC_COLOR, GAS_COLOR, formatEur, formatPrice, formatNum,
  hourLabel, dayLabel, localDay, priceAt, pricesOfDay, cheapestWindow, extremes,
} from '@/lib/energy'
import { BarChart, type Bar } from '@/components/ui/BarChart'
import { Panel, Label, Segmented, Skeleton, EmptyState } from '@/components/ui/motion'

// ── Stat tile ─────────────────────────────────────────────────────────────────
function Stat({ icon, color, label, value, sub, index }: {
  icon: React.ReactNode; color: string; label: string; value: string; sub?: React.ReactNode; index: number
}) {
  return (
    <Panel index={index} className="relative overflow-hidden p-4 sm:p-5">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-20 blur-2xl" style={{ background: color }} />
      <div className="relative flex items-center gap-2 label-caps">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-card3 [&>svg]:h-3.5 [&>svg]:w-3.5" style={{ color }}>{icon}</span>
        {label}
      </div>
      <p className="relative mt-2 text-2xl font-semibold tracking-tight text-fg tabular sm:text-3xl">{value}</p>
      {sub && <p className="relative mt-1 text-xs text-fg3">{sub}</p>}
    </Panel>
  )
}

// ── Price chart ───────────────────────────────────────────────────────────────
function priceBars(prices: EnergyPrice[], now: Date): Bar[] {
  const cur = priceAt(prices, now)
  const ext = extremes(prices)
  return prices.map((p, i) => ({
    marker: p === ext?.low ? 'laagst' : p === ext?.high ? 'hoogst' : undefined,
    key: p.from,
    value: p.total,
    tick: i % 3 === 0 ? hourLabel(p.from).slice(0, 2) : undefined,
    tone: p === cur ? 'current' : new Date(p.till) <= now ? 'muted' : 'normal',
    tooltip: (
      <span>
        <span className="text-fg3">{hourLabel(p.from)}–{hourLabel(p.till)} · </span>
        <span className="font-semibold">{formatPrice(p.total)}</span>
        <span className="text-fg3"> /kWh</span>
      </span>
    ),
  }))
}

function PriceChart({ elec }: { elec: EnergyPrice[] }) {
  const now = new Date()
  const today = localDay(now)
  const tomorrowDate = new Date(now); tomorrowDate.setDate(now.getDate() + 1)
  const tomorrow = localDay(tomorrowDate)
  const hasTomorrow = pricesOfDay(elec, tomorrow).length > 0
  const [day, setDay] = useState<'vandaag' | 'morgen'>('vandaag')
  const shown = pricesOfDay(elec, day === 'morgen' && hasTomorrow ? tomorrow : today)
  const avg = shown.length ? shown.reduce((s, p) => s + p.total, 0) / shown.length : 0
  const ext = extremes(shown)

  return (
    <Panel index={4} className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Label icon={<Zap />}>Stroomprijs per uur</Label>
        <Segmented layoutId="energy-price-day" size="sm" value={hasTomorrow ? day : 'vandaag'} onChange={setDay}
          items={[{ id: 'vandaag', label: 'Vandaag' }, { id: 'morgen', label: hasTomorrow ? 'Morgen' : 'Morgen (na 14u)' }]} />
      </div>
      <div className="pt-8">
        <BarChart bars={priceBars(shown, now)} color={ELEC_COLOR} height={180} yFormat={v => v.toFixed(2).replace('.', ',')} />
      </div>
      {ext && (
        <div className="border-t border-subtle pt-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl bg-card3 px-3 py-2.5">
              <TrendingDown className="h-4 w-4 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <p className="label-caps">Goedkoopst</p>
                <p className="text-sm text-fg tabular"><b>{hourLabel(ext.low.from)}–{hourLabel(ext.low.till)}</b> · {formatPrice(ext.low.total)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-card3 px-3 py-2.5">
              <TrendingUp className="h-4 w-4 shrink-0 text-orange-400" />
              <div className="min-w-0">
                <p className="label-caps">Duurst</p>
                <p className="text-sm text-fg tabular"><b>{hourLabel(ext.high.from)}–{hourLabel(ext.high.till)}</b> · {formatPrice(ext.high.total)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-card3 px-3 py-2.5">
              <Zap className="h-4 w-4 shrink-0 text-fg3" />
              <div className="min-w-0">
                <p className="label-caps">Gemiddeld</p>
                <p className="text-sm text-fg tabular"><b>{formatPrice(avg)}</b> /kWh</p>
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-fg3">Prijzen incl. btw, energiebelasting en inkoopvergoeding</p>
        </div>
      )}
    </Panel>
  )
}

// ── Usage charts ──────────────────────────────────────────────────────────────
function usageBars(points: EnergyUsagePoint[], kind: 'elec' | 'gas', hourly: boolean): Bar[] {
  return points.map((p, i) => {
    const value = kind === 'elec' ? p.electricityKwh : p.gasM3
    const cost  = kind === 'elec' ? p.electricityCost : p.gasCost
    const unit  = kind === 'elec' ? 'kWh' : 'm³'
    const when  = hourly && p.from ? `${hourLabel(p.from)}` : dayLabel(p.date)
    const every = hourly ? 3 : Math.max(1, Math.ceil(points.length / 8))
    return {
      key: (p.from ?? p.date) + kind,
      value,
      tick: i % every === 0 ? (hourly && p.from ? hourLabel(p.from).slice(0, 2) : String(new Date(p.date).getDate())) : undefined,
      tooltip: (
        <span>
          <span className="text-fg3">{when} · </span>
          <span className="font-semibold">{formatNum(value, kind === 'elec' ? 2 : 2)} {unit}</span>
          <span className="text-fg3"> · {formatEur(cost)}</span>
        </span>
      ),
    }
  })
}

function UsageSection() {
  const { data: usage, isLoading } = useEnergyUsage()
  const [range, setRange] = useState<'dagen' | 'uren'>('dagen')

  if (isLoading) return <Skeleton className="h-72 rounded-3xl" />
  if (!usage?.configured) {
    return (
      <Panel index={5} className="flex items-start gap-3 p-5 text-sm text-fg2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-fg3" />
        <p>Wil je ook je eigen verbruik en kosten zien? Zet <code className="text-fg">FRANK_EMAIL</code> en <code className="text-fg">FRANK_PASSWORD</code> (je Frank Energie-login) in de <code className="text-fg">.env</code> op de server.</p>
      </Panel>
    )
  }
  if (usage.error) {
    return (
      <Panel index={5} className="flex p-6">
        <EmptyState icon={<Info className="h-5 w-5" />} title="Verbruik niet beschikbaar" hint={usage.error} />
      </Panel>
    )
  }

  const hourly = range === 'uren'
  const points = hourly ? usage.hours : usage.days
  const sum = (k: 'electricityKwh' | 'electricityCost' | 'gasM3' | 'gasCost') => points.reduce((s, p) => s + p[k], 0)
  const period = hourly ? (usage.hoursDate ? dayLabel(usage.hoursDate) : '') : `laatste ${usage.days.length} dagen`

  const chart = (kind: 'elec' | 'gas') => {
    const isElec = kind === 'elec'
    return (
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-fg">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: isElec ? ELEC_COLOR : GAS_COLOR }} />
            {isElec ? 'Stroom' : 'Gas'}
          </p>
          <p className="text-xs text-fg2 tabular">
            <b className="text-fg">{formatNum(sum(isElec ? 'electricityKwh' : 'gasM3'), 1)} {isElec ? 'kWh' : 'm³'}</b>
            {' · '}{formatEur(sum(isElec ? 'electricityCost' : 'gasCost'))}
          </p>
        </div>
        <div className="pt-8">
          <BarChart bars={usageBars(points, kind, hourly)} color={isElec ? ELEC_COLOR : GAS_COLOR} height={130}
            yFormat={v => formatNum(v, v < 10 ? 1 : 0)} />
        </div>
      </div>
    )
  }

  return (
    <Panel index={5} className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label icon={<Clock />}>Verbruik</Label>
          <p className="mt-1 text-xs text-fg3">{period}</p>
        </div>
        <Segmented layoutId="energy-usage-range" size="sm" value={range} onChange={setRange}
          items={[{ id: 'dagen', label: 'Per dag' }, { id: 'uren', label: 'Per uur' }]} />
      </div>
      {points.length === 0 ? (
        <p className="py-8 text-center text-sm text-fg3">Nog geen verbruiksdata ontvangen</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {chart('elec')}
          {!usage.month?.gasExcluded && chart('gas')}
        </div>
      )}
      <p className="mt-1 text-[11px] text-fg3">Frank krijgt de meterstanden van de netbeheerder, meestal een dag later.</p>
    </Panel>
  )
}

export function EnergyWidget() {
  const { data: prices, isLoading, isError } = useEnergyPrices()
  const { data: usage } = useEnergyUsage()
  const now = new Date()

  const elecNow = prices ? priceAt(prices.electricity, now) : undefined
  const gasNow  = prices ? priceAt(prices.gas, now) : undefined
  const window3 = prices ? cheapestWindow(prices.electricity, 3, now) : null
  const todayElec = prices ? pricesOfDay(prices.electricity, localDay(now)) : []
  const avgToday = todayElec.length ? todayElec.reduce((s, p) => s + p.total, 0) / todayElec.length : 0
  const month = usage?.configured && !usage.error ? usage.month : null
  const lastDay = usage?.days.at(-1)

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}</div>
        ) : isError || !prices ? (
          <Panel className="flex p-8"><EmptyState icon={<Zap className="h-5 w-5" />} title="Frank Energie niet bereikbaar" hint="Probeer het later opnieuw" /></Panel>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Stat index={0} icon={<Zap />} color={ELEC_COLOR} label="Stroom nu"
                value={elecNow ? formatPrice(elecNow.total) : '–'}
                sub={elecNow && avgToday > 0 && (
                  <span className={cn(elecNow.total <= avgToday ? 'text-emerald-400' : 'text-orange-400')}>
                    {elecNow.total <= avgToday ? 'onder' : 'boven'} gemiddeld ({formatPrice(avgToday)})
                  </span>
                )} />
              <Stat index={1} icon={<Clock />} color="#34d399" label="Goedkoopst"
                value={window3 ? `${hourLabel(window3.start.from)}–${hourLabel(window3.end.till)}` : '–'}
                sub={window3 && `3 uur · gem. ${formatPrice(window3.avg)}${localDay(window3.start.from) !== localDay(now) ? ' · morgen' : ''}`} />
              <Stat index={2} icon={<Flame />} color={GAS_COLOR} label="Gas vandaag"
                value={gasNow ? formatPrice(gasNow.total) : '–'} sub="per m³" />
              {month ? (
                <Stat index={3} icon={<Wallet />} color="#c084fc" label="Deze maand"
                  value={formatEur(month.actualCosts)}
                  sub={<>verwacht {formatEur(month.expectedCostsSoFar)} · hele maand ~{formatEur(month.expectedCosts)}</>} />
              ) : (
                <Stat index={3} icon={<Wallet />} color="#c084fc" label="Laatste dag"
                  value={lastDay ? formatEur(lastDay.electricityCost + lastDay.gasCost) : '–'}
                  sub={lastDay ? `${formatNum(lastDay.electricityKwh)} kWh · ${formatNum(lastDay.gasM3)} m³` : 'koppel je Frank-account'} />
              )}
            </div>

            <PriceChart elec={prices.electricity} />
          </>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><UsageSection /></motion.div>
      </div>
    </div>
  )
}
