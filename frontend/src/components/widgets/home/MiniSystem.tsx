import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Cpu } from 'lucide-react'
import { systemApi, type SystemStats } from '@/lib/api'
import { formatBps } from '@/lib/format'
import { ArcGauge } from '@/components/ui/ArcGauge'
import { AnimatedNumber, Skeleton } from '@/components/ui/motion'
import { useContainerSize, TileHeader } from './shared'

export function MiniSystem() {
  const ref = useRef<HTMLDivElement>(null)
  const { h, w } = useContainerSize(ref)
  const { data } = useQuery<SystemStats>({ queryKey: ['system'], queryFn: systemApi.getStats, refetchInterval: 3_000 })

  const layout: 'row' | 'grid' | 'col' = w >= 480 ? 'row' : w >= 260 ? 'grid' : 'col'
  const gaugeSize = layout === 'row'
    ? (h > 300 ? 'xl' : h > 220 ? 'md' : 'home')
    : (h > 380 ? 'md' : 'home')
  const showNetwork  = h > 170
  const showDiskList = h > 350 && !!(data?.disks && data.disks.length > 1)

  const gauges = !data ? [] : [
    { label: 'CPU',  value: data.cpuLoad,       color: '#38bdf8', sublabel: data.cpuTemp > 0 ? `${Math.round(data.cpuTemp)}°C` : undefined },
    { label: 'GPU',  value: data.gpuLoad,       color: '#a78bfa', sublabel: data.gpuTemp > 0 ? `${Math.round(data.gpuTemp)}°C` : undefined },
    { label: 'RAM',  value: data.memoryPercent, color: '#2dd4bf', sublabel: `${data.memoryUsedGb.toFixed(1)} GB` },
    { label: 'Disk', value: data.diskPercent,   color: data.diskPercent > 85 ? '#f87171' : '#fbbf24', sublabel: undefined },
  ]

  return (
    <div ref={ref} className="flex h-full flex-col p-5">
      <TileHeader icon={<Cpu />} title="Systeem" />
      {!data ? (
        <div className="flex flex-1 items-center justify-around">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-16 rounded-full" />)}</div>
      ) : (
        <>
          {layout === 'row' && (
            <div className="flex flex-1 items-center justify-around">
              {gauges.map(g => <ArcGauge key={g.label} size={gaugeSize} {...g} />)}
            </div>
          )}
          {layout === 'grid' && (
            <div className="grid flex-1 grid-cols-2 items-center justify-items-center gap-2">
              {gauges.map(g => <ArcGauge key={g.label} size={gaugeSize} {...g} />)}
            </div>
          )}
          {layout === 'col' && (
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
              <span className="w-6 shrink-0 text-fg3">{disk.name.replace(':\\', '')}</span>
              <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[var(--c-track)]">
                <div className="absolute inset-y-0 left-0 rounded-full bg-sky-400 transition-[width] duration-700" style={{ width: `${disk.percent}%` }} />
              </div>
              <span className="text-[10px] text-fg3 tabular">{disk.usedGb}/{disk.totalGb} GB</span>
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
