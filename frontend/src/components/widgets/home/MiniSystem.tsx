import { useRef } from 'react'
import { ArrowDown, ArrowUp, Cpu, Monitor } from 'lucide-react'
import { useSystemSource } from '@/lib/pc'
import { formatBps, formatGb, diskTotals } from '@/lib/format'
import { ArcGauge } from '@/components/ui/ArcGauge'
import { AnimatedNumber, Skeleton } from '@/components/ui/motion'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useContainerSize, TileHeader } from './shared'
import { SYSTEM_VISIBLE_KEY, type SystemItem } from './TileConfig'
import { SourceToggle, PcPowerButton, PcOfflineNote } from '../system/PcControls'

type GaugeSize = 'sm' | 'home' | 'md' | 'xl'
const GAUGE_PX: Record<GaugeSize, number> = { sm: 70, home: 90, md: 128, xl: 160 }

/**
 * Picks the biggest gauge arrangement that fits the space: one row, a 2-column
 * grid, or (when even that doesn't fit) compact bars.
 */
function pickLayout(n: number, w: number, h: number): { layout: 'row' | 'grid' | 'col'; size: GaugeSize } {
  const gap = 8
  if (n === 0) return { layout: 'col', size: 'sm' }
  const rows = Math.ceil(n / 2)
  // Biggest size first; at equal size a single row wins
  for (const size of ['xl', 'md', 'home', 'sm'] as const) {
    const px = GAUGE_PX[size]
    if (n * px + (n - 1) * gap <= w && px <= h) return { layout: 'row', size }
    if (n > 1 && 2 * px + gap <= w && rows * px + (rows - 1) * gap <= h) return { layout: 'grid', size }
  }
  return { layout: 'col', size: 'sm' }
}

export function MiniSystem() {
  const ref = useRef<HTMLDivElement>(null)
  const { h, w } = useContainerSize(ref)
  const { data, pc, pcAvailable, preferred, setPreferred, source, sourceLabel } = useSystemSource()
  const showOfflineNote = pcAvailable && preferred === 'pc' && source === 'server' && pc && h > 200

  // Which parts the user wants on this tile (empty = everything)
  const [visible] = useLocalStorage<string[]>(SYSTEM_VISIBLE_KEY, [])
  const want = (id: SystemItem) => visible.length === 0 || visible.includes(id)

  const disk = data ? diskTotals(data.disks, data.diskPercent) : null

  const allGauges = !data || !disk ? [] : [
    { id: 'cpu',  label: 'CPU',  value: data.cpuLoad,       color: '#38bdf8', sublabel: data.cpuTemp > 0 ? `${Math.round(data.cpuTemp)}°C` : undefined },
    { id: 'gpu',  label: 'GPU',  value: data.gpuLoad,       color: '#a78bfa', sublabel: data.gpuTemp > 0 ? `${Math.round(data.gpuTemp)}°C` : undefined },
    { id: 'ram',  label: 'RAM',  value: data.memoryPercent, color: '#2dd4bf', sublabel: data.memoryTotalGb > 0 ? `${data.memoryUsedGb.toFixed(1)}/${Math.ceil(data.memoryTotalGb)} GB` : `${data.memoryUsedGb.toFixed(1)} GB` },
    { id: 'disk', label: 'Disk', value: disk.percent,       color: disk.percent > 85 ? '#f87171' : '#fbbf24', sublabel: disk.hasDrives ? `${formatGb(disk.freeGb)} vrij` : undefined },
  ] as const
  const gauges = allGauges.filter(g => want(g.id)).map(({ id: _id, ...g }) => g)

  // Space budget (w/h are already inside the padding): header (~40), network row (~44), drive rows (~22 each)
  const innerW = w
  let freeH = h - 40 - (showOfflineNote ? 40 : 0)
  const showNetwork = want('network') && freeH - 44 >= 60
  if (showNetwork) freeH -= 44
  const driveCount = data?.disks.length ?? 0
  const showDiskList = want('drives') && driveCount > 0
    && (gauges.length === 0 || driveCount > 1)
    && freeH - driveCount * 22 >= (gauges.length ? 70 : 0)
  if (showDiskList) freeH -= driveCount * 22
  const { layout, size: gaugeSize } = pickLayout(gauges.length, innerW, freeH)

  return (
    <div ref={ref} className="flex h-full flex-col p-5">
      <TileHeader icon={source === 'pc' ? <Monitor /> : <Cpu />} title={pcAvailable ? sourceLabel : 'Systeem'}
        right={pc?.configured && (
          <div className="flex items-center gap-1.5">
            {pcAvailable && <SourceToggle size="xs" value={preferred} onChange={setPreferred} pcName={pc.name} />}
            <PcPowerButton pc={pc} compact />
          </div>
        )} />
      {showOfflineNote && <div className="-mt-1 mb-2"><PcOfflineNote pc={pc} compact /></div>}
      {!data ? (
        <div className="flex flex-1 items-center justify-around">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-16 rounded-full" />)}</div>
      ) : (
        <>
          {gauges.length > 0 && layout === 'row' && (
            <div className="flex flex-1 items-center justify-around">
              {gauges.map(g => <ArcGauge key={g.label} size={gaugeSize} {...g} />)}
            </div>
          )}
          {gauges.length > 0 && layout === 'grid' && (
            <div className="grid flex-1 grid-cols-2 items-center justify-items-center gap-2">
              {gauges.map(g => <ArcGauge key={g.label} size={gaugeSize} {...g} />)}
            </div>
          )}
          {gauges.length > 0 && layout === 'col' && (
            <div className="flex flex-1 flex-col justify-around gap-1 text-xs">
              {gauges.map(g => (
                <div key={g.label} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-fg3">{g.label}</span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--c-track)]">
                    <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: `${g.value}%`, background: g.color, boxShadow: `0 0 8px ${g.color}` }} />
                  </div>
                  <AnimatedNumber className="w-9 text-right text-fg2" value={g.value} suffix="%" />
                </div>
              ))}
            </div>
          )}

          {showDiskList && data.disks.map(disk => (
            <div key={disk.name} className="mt-1.5 flex items-center gap-2 text-xs text-fg2">
              <span className="w-16 shrink-0 truncate text-fg3" title={disk.name}>{disk.name.replace(':\\', '')}</span>
              <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[var(--c-track)]">
                <div className="absolute inset-y-0 left-0 rounded-full bg-sky-400 transition-[width] duration-700" style={{ width: `${disk.percent}%` }} />
              </div>
              <span className="shrink-0 text-[10px] text-fg3 tabular">{formatGb(Math.max(0, disk.totalGb - disk.usedGb))} vrij van {formatGb(disk.totalGb)}</span>
            </div>
          ))}

          {showNetwork && (
            <div className="mt-2 flex justify-center gap-8 border-t border-subtle pt-3 text-xs text-fg2">
              <span className="flex items-center gap-1.5">
                <ArrowDown className="h-3.5 w-3.5 text-sky-400" />
                <AnimatedNumber value={data.networkDownBps} format={formatBps} />
              </span>
              <span className="flex items-center gap-1.5">
                <ArrowUp className="h-3.5 w-3.5 text-violet-400" />
                <AnimatedNumber value={data.networkUpBps} format={formatBps} />
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
