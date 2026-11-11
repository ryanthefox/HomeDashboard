import { useRef } from 'react'
import { motion } from 'motion/react'
import { Car, TrainFront, Route, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrainTrip } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useTravel, useTravelDirection, hhmm, delayColor, formatMinutes } from '@/lib/travel'
import { EmptyState, Segmented, Skeleton } from '@/components/ui/motion'
import { useContainerSize, TileHeader } from './shared'
import { TRAVEL_VISIBLE_KEY } from './TileConfig'

const TRAIN_ROW_H = 44

function TrainRow({ t, index }: { t: TrainTrip; index: number }) {
  const products = [...new Set(t.legs.map(l => l.product).filter(Boolean))]
  const track = t.legs[0]?.track
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
      className={cn('flex h-10 items-center gap-2.5 rounded-xl bg-card3 px-2.5', t.cancelled && 'opacity-60')}>
      <div className="w-[88px] shrink-0">
        <p className={cn('text-sm font-semibold leading-tight text-fg tabular', t.cancelled && 'line-through')}>
          {hhmm(t.departure)}
          {t.delayMinutes > 0 && !t.cancelled && <span className="ml-1 text-xs font-semibold text-red-400">+{t.delayMinutes}</span>}
        </p>
        <p className="text-[11px] leading-tight text-fg3 tabular">aan {hhmm(t.arrivalActual ?? t.arrival)}</p>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {products.map(p => <span key={p} className="rounded-md bg-card4 px-1.5 py-0.5 text-[10px] font-semibold text-fg2">{p}</span>)}
        <span className="truncate text-[11px] text-fg3">
          {t.cancelled ? 'Rijdt niet' : t.transfers === 0 ? 'direct' : `${t.transfers}× overstap`}
        </span>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-semibold text-fg tabular">{formatMinutes(t.minutes)}</p>
        {track && <p className="text-[10px] text-fg3">spoor {track}</p>}
      </div>
    </motion.div>
  )
}

export function MiniTravel() {
  const ref = useRef<HTMLDivElement>(null)
  const { h, w } = useContainerSize(ref)
  const [dir, setDir] = useTravelDirection()
  const { data, isLoading } = useTravel(dir)
  const [items] = useLocalStorage<string[]>(TRAVEL_VISIBLE_KEY, [])
  const showCar = (items.length === 0 || items.includes('car')) && data?.carConfigured
  const showTrain = (items.length === 0 || items.includes('train')) && data?.trainConfigured
  const car = data?.car

  // Header 44, car block 78, trains header 24
  const trainRows = Math.max(1, Math.min(5, Math.floor((h - 44 - (showCar ? 86 : 0) - 24) / TRAIN_ROW_H)))

  return (
    <div ref={ref} className="flex h-full flex-col overflow-hidden p-4">
      <TileHeader icon={<Route />} title="Reistijd"
        right={<Segmented size="sm" layoutId="travel-dir" value={dir} onChange={setDir}
          items={[{ id: 'work', label: w > 0 && w < 320 ? 'Werk' : 'Naar werk' }, { id: 'home', label: w > 0 && w < 320 ? 'Huis' : 'Naar huis' }]} itemClassName="px-2 py-0.5 text-[11px]" />} />

      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-10" /></div>
      ) : !data || (!data.carConfigured && !data.trainConfigured) ? (
        <EmptyState icon={<Route className="h-5 w-5" />} title="Reistijd nog niet ingesteld" hint="Zie TRAVEL_… in .env" compact={h < 200} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {showCar && (
            <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-card3 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card4 text-fg2"><Car className="h-5 w-5" /></span>
              {car ? (
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-semibold tracking-tight text-fg tabular">{formatMinutes(car.minutes)}</p>
                    <span className="text-xs font-semibold" style={{ color: delayColor(car.delayMinutes) }}>
                      {car.delayMinutes > 0 ? `+${car.delayMinutes} min file` : 'geen file'}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-fg3">
                    {car.via ? `via ${car.via} · ` : ''}{car.km.toLocaleString('nl-NL')} km · vertrek nu, aan {new Date(Date.now() + car.minutes * 60_000).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-fg3"><AlertTriangle className="h-3.5 w-3.5" />{data.carError ?? 'Geen route'}</p>
              )}
            </div>
          )}

          {showTrain && (
            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-fg3">
                <TrainFront className="h-3.5 w-3.5 shrink-0" /> <span className="shrink-0">Trein</span>
                {data.trains[0] && (
                  <span className="truncate normal-case tracking-normal">· {data.trains[0].legs[0]?.from} → {data.trains[0].legs.at(-1)?.to}</span>
                )}
              </p>
              {data.trains.length === 0
                ? <p className="text-xs text-fg3">{data.trainError ?? 'Geen treinen gevonden'}</p>
                : data.trains.slice(0, trainRows).map((t, i) => <TrainRow key={t.departure + i} t={t} index={i} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
