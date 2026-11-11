import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { Car, TrainFront, Route, RefreshCw, ChevronDown, AlertTriangle, Users, Clock, MapPin, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { travelApi, type TrainTrip, type TravelData } from '@/lib/api'
import { useTravel, useTravelDirection, hhmm, delayColor, formatMinutes } from '@/lib/travel'
import { Panel, Label, Segmented, Skeleton, EmptyState } from '@/components/ui/motion'
import { StationSettings } from './home/TileConfig'

const crowdLabel: Record<string, string> = { LOW: 'Rustig', MEDIUM: 'Gemiddeld druk', HIGH: 'Druk' }

// ── Car ───────────────────────────────────────────────────────────────────────
function CarPanel({ data }: { data: TravelData }) {
  const car = data.car
  return (
    <Panel index={0} className="relative overflow-hidden p-5">
      {car && <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-20 blur-3xl" style={{ background: delayColor(car.delayMinutes) }} />}
      <Label icon={<Car />}>Auto · {data.fromName} → {data.toName}</Label>
      {!car ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-fg3"><AlertTriangle className="h-4 w-4" />{data.carError ?? 'Geen route gevonden'}</p>
      ) : (
        <>
          <div className="relative mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className="text-5xl font-semibold tracking-tight text-fg tabular">{formatMinutes(car.minutes)}</p>
            <span className="mb-1.5 rounded-lg px-2 py-0.5 text-sm font-semibold" style={{ color: delayColor(car.delayMinutes), background: `${delayColor(car.delayMinutes)}1f` }}>
              {car.delayMinutes > 0 ? `+${car.delayMinutes} min file` : 'Geen file'}
            </span>
          </div>

          {/* Normal vs now */}
          <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-card3">
            <motion.div className="absolute inset-y-0 left-0 rounded-full bg-emerald-400/70"
              initial={{ width: 0 }} animate={{ width: `${(car.typicalMinutes / Math.max(car.minutes, car.typicalMinutes)) * 100}%` }} transition={{ duration: 0.8 }} />
            {car.delayMinutes > 0 && (
              <motion.div className="absolute inset-y-0 rounded-r-full" style={{ background: delayColor(car.delayMinutes), left: `${(car.typicalMinutes / car.minutes) * 100}%` }}
                initial={{ width: 0 }} animate={{ width: `${(car.delayMinutes / car.minutes) * 100}%` }} transition={{ duration: 0.8, delay: 0.3 }} />
            )}
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: <Clock />, label: 'Aankomst', value: new Date(Date.now() + car.minutes * 60_000).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) },
              { icon: <Route />, label: 'Zonder file', value: formatMinutes(car.typicalMinutes) },
              { icon: <MapPin />, label: 'Afstand', value: `${car.km.toLocaleString('nl-NL')} km` },
            ].map(s => (
              <div key={s.label} className="min-w-0 rounded-2xl bg-card3 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] text-fg3 [&>svg]:h-3.5 [&>svg]:w-3.5">{s.icon}{s.label}</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-fg tabular">{s.value}</p>
              </div>
            ))}
          </div>
          <p className="relative mt-3 text-[11px] text-fg3">
            {car.via ? `Via ${car.via} · ` : ''}Bij vertrek nu · bijgewerkt {hhmm(car.updatedAt)}
            {data.carError && <span className="text-red-400"> · laatst bekende tijd ({data.carError})</span>}
          </p>
        </>
      )}
    </Panel>
  )
}

// ── Train ─────────────────────────────────────────────────────────────────────
function TripRow({ t, open, onToggle }: { t: TrainTrip; open: boolean; onToggle: () => void }) {
  const products = [...new Set(t.legs.map(l => l.product).filter(Boolean))]
  const dep = t.departureActual ?? t.departure
  const leaveIn = Math.round((new Date(dep).getTime() - Date.now()) / 60_000)
  return (
    <div className={cn('rounded-2xl bg-card3 transition-colors', open && 'bg-card4', t.cancelled && 'opacity-60')}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
        <div className="w-[124px] shrink-0 whitespace-nowrap">
          <p className={cn('text-base font-semibold leading-tight text-fg tabular', t.cancelled && 'line-through')}>
            {hhmm(t.departure)} <span className="text-fg3">→</span> {hhmm(t.arrivalActual ?? t.arrival)}
          </p>
          <p className="text-[11px] text-fg3">
            {t.cancelled ? 'Rijdt niet' : leaveIn <= 0 ? 'Vertrekt nu' : `over ${formatMinutes(leaveIn)}`}
            {t.delayMinutes > 0 && !t.cancelled && <span className="font-semibold text-red-400"> · +{t.delayMinutes}</span>}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {products.map(p => <span key={p} className="rounded-md bg-card4 px-1.5 py-0.5 text-[10px] font-semibold text-fg2">{p}</span>)}
          <span className="text-[11px] text-fg3">{t.transfers === 0 ? 'direct' : `${t.transfers}× overstap`}</span>
          {t.crowd && crowdLabel[t.crowd] && (
            <span className="flex items-center gap-1 text-[11px] text-fg3"><Users className="h-3 w-3" />{crowdLabel[t.crowd]}</span>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-fg tabular">{formatMinutes(t.minutes)}</p>
          {t.legs[0]?.track && <p className="text-[11px] text-fg3">spoor {t.legs[0].track}</p>}
        </div>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-fg3 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-3 px-3.5 pb-3.5 pt-1">
              {t.legs.map((l, i) => (
                <div key={i} className="relative pl-5">
                  <span className="absolute bottom-1 left-[5px] top-1.5 w-px bg-subtle2" />
                  <span className="absolute left-0 top-1 h-[11px] w-[11px] rounded-full border-2 border-sky-400 bg-[var(--c-solid)]" />
                  <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-fg">
                    <span className="font-semibold tabular">{hhmm(l.departureActual ?? l.departure)}</span>
                    <span className="font-medium">{l.from}</span>
                    {l.track && <span className="text-xs text-fg3">spoor {l.track}</span>}
                  </p>
                  <p className={cn('my-1 text-xs text-fg3', l.cancelled && 'text-red-400')}>
                    {l.product} {l.direction && `richting ${l.direction}`}{l.cancelled && ' · rijdt niet'}
                  </p>
                  <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-fg2">
                    <span className="font-semibold tabular">{hhmm(l.arrivalActual ?? l.arrival)}</span>
                    <span>{l.to}</span>
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TrainPanel({ data }: { data: TravelData }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const first = data.trains[0]
  return (
    <Panel index={1} className="p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <Label icon={<TrainFront />}>Trein</Label>
        {first && <p className="truncate text-xs text-fg3">{first.legs[0]?.from} → {first.legs.at(-1)?.to}</p>}
      </div>
      {data.trains.length === 0 ? (
        <p className="flex items-center gap-2 py-4 text-sm text-fg3"><AlertTriangle className="h-4 w-4" />{data.trainError ?? 'Geen treinen gevonden'}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {data.trains.map((t, i) => <TripRow key={t.departure + i} t={t} open={openIdx === i} onToggle={() => setOpenIdx(o => (o === i ? null : i))} />)}
        </div>
      )}
      {data.trainError && data.trains.length > 0 && <p className="mt-2 text-[11px] text-red-400">Laatst bekende treinen ({data.trainError})</p>}
    </Panel>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function TravelWidget() {
  const qc = useQueryClient()
  const [dir, setDir] = useTravelDirection()
  const { data, isLoading, isError } = useTravel(dir)
  const [refreshing, setRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    try { qc.setQueryData(['travel', dir], await travelApi.get(dir, true)) } catch { /* ignore */ }
    setRefreshing(false)
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented layoutId="travel-tab-dir" value={dir} onChange={setDir}
            items={[{ id: 'work', label: 'Naar werk' }, { id: 'home', label: 'Naar huis' }]} />
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(s => !s)} title="Stations"
              className={cn('flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors', showSettings ? 'bg-card4 text-fg' : 'bg-card3 text-fg2 hover:text-fg')}>
              <Settings2 className="h-4 w-4" /><span className="hidden sm:inline">Stations</span>
            </button>
            <button onClick={() => void refresh()} title="Vernieuwen" className="flex h-9 w-9 items-center justify-center rounded-xl bg-card3 text-fg2 hover:text-fg">
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showSettings && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <Panel className="p-4 sm:p-5"><div className="max-w-xl"><StationSettings /></div></Panel>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72 rounded-3xl" /><Skeleton className="h-96 rounded-3xl" /></div>
        ) : isError || !data ? (
          <Panel className="flex p-8"><EmptyState icon={<Route className="h-5 w-5" />} title="Reistijd niet beschikbaar" hint="Probeer het later opnieuw" /></Panel>
        ) : !data.carConfigured && !data.trainConfigured ? (
          <Panel className="flex p-8"><EmptyState icon={<Route className="h-5 w-5" />} title="Reistijd nog niet ingesteld" hint="Zet TRAVEL_HOME_ADDRESS, TRAVEL_WORK_ADDRESS en TOMTOM_KEY / NS_API_KEY in de .env op de server" /></Panel>
        ) : (
          <div className={cn('grid grid-cols-1 items-start gap-4', data.carConfigured && data.trainConfigured && 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]')}>
            {data.carConfigured && <CarPanel data={data} />}
            {data.trainConfigured && <TrainPanel data={data} />}
          </div>
        )}
      </div>
    </div>
  )
}
