import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, HardDrive, Thermometer, Wifi } from 'lucide-react'
import { systemApi, type SystemStats, type DiskDriveInfo } from '@/lib/api'
import { formatBps, formatGb } from '@/lib/format'
import { ArcGauge } from '@/components/ui/ArcGauge'
import { AnimatedNumber, Panel, Label, Skeleton } from '@/components/ui/motion'

function tempColor(t: number) {
  if (t > 85) return '#f87171'
  if (t > 70) return '#fb923c'
  if (t > 55) return '#facc15'
  return '#34d399'
}

function Bar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--c-track)]">
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
        transition={{ type: 'spring', stiffness: 70, damping: 18, delay }}
        style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 12px -2px ${color}` }}
      />
    </div>
  )
}

export function SystemWidget() {
  const { data, isLoading } = useQuery<SystemStats>({ queryKey: ['system'], queryFn: systemApi.getStats, refetchInterval: 3_000 })

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-56 rounded-3xl" />)}
      </div>
    )
  }

  const memLabel  = data.memoryTotalGb > 0 ? `${data.memoryUsedGb.toFixed(1)} / ${data.memoryTotalGb.toFixed(0)} GB` : undefined
  const mainDisk  = data.disks[0]
  const diskLabel = mainDisk ? `${formatGb(mainDisk.usedGb)} / ${formatGb(mainDisk.totalGb)}` : undefined

  const gauges = [
    { label: 'CPU',      value: data.cpuLoad,       color: '#38bdf8', temp: data.cpuTemp },
    { label: 'GPU',      value: data.gpuLoad,       color: '#a78bfa', temp: data.gpuTemp },
    { label: 'Geheugen', value: data.memoryPercent, color: '#2dd4bf', sublabel: memLabel },
    { label: 'Schijf',   value: mainDisk?.percent ?? data.diskPercent, color: data.diskPercent > 85 ? '#f87171' : '#fbbf24', sublabel: diskLabel },
  ]

  return (
    <div className="h-full space-y-4 overflow-y-auto pb-2 scrollbar-hide">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {gauges.map((g, i) => (
          <Panel key={g.label} index={i} className="relative flex flex-col items-center justify-center gap-2 overflow-hidden p-5">
            <div className="pointer-events-none absolute -bottom-1/2 left-1/2 h-full w-full -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: g.color, opacity: 0.06 + g.value / 1200 }} />
            <ArcGauge label={g.label} value={g.value} color={g.color} sublabel={g.sublabel} size="xl" />
            {g.temp != null && g.temp > 0 && (
              <p className="flex items-center gap-1 text-sm font-semibold tabular" style={{ color: tempColor(g.temp) }}>
                <Thermometer className="h-3.5 w-3.5" /><AnimatedNumber value={Math.round(g.temp)} suffix="°C" />
              </p>
            )}
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel index={4} className="space-y-4 p-5">
          <Label icon={<HardDrive />}>Opslag</Label>
          {data.disks.length === 0
            ? <p className="text-xs text-fg3">Geen schijven gevonden</p>
            : data.disks.map((d, i) => <DiskRow key={d.name} disk={d} delay={i * 0.06} />)}
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel index={5} className="p-5">
            <Label icon={<Wifi />} className="mb-4">Netwerk</Label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Download', value: data.networkDownBps, icon: <ArrowDown className="h-3.5 w-3.5 text-sky-400" /> },
                { label: 'Upload',   value: data.networkUpBps,   icon: <ArrowUp className="h-3.5 w-3.5 text-violet-400" /> },
              ].map(n => (
                <div key={n.label}>
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-fg3">{n.icon}{n.label}</p>
                  <AnimatedNumber className="text-2xl font-semibold tracking-tight text-fg" value={n.value} format={formatBps} />
                </div>
              ))}
            </div>
          </Panel>

          {(data.cpuTemp > 0 || data.gpuTemp > 0) && (
            <Panel index={6} className="space-y-4 p-5">
              <Label icon={<Thermometer />}>Temperaturen</Label>
              {[['CPU', data.cpuTemp], ['GPU', data.gpuTemp]].filter(([, t]) => (t as number) > 0).map(([label, t]) => (
                <div key={label as string} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-fg2">{label}</span>
                    <span className="text-sm font-semibold tabular" style={{ color: tempColor(t as number) }}>
                      <AnimatedNumber value={Math.round(t as number)} suffix="°C" />
                    </span>
                  </div>
                  <Bar pct={t as number} color={tempColor(t as number)} />
                </div>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

function DiskRow({ disk, delay }: { disk: DiskDriveInfo; delay: number }) {
  const color = disk.percent > 90 ? '#f87171' : disk.percent > 75 ? '#fb923c' : '#38bdf8'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fg">{disk.name}</span>
        <span className="text-xs text-fg2 tabular">
          {formatGb(disk.usedGb)} / {formatGb(disk.totalGb)}
          <span className="ml-2 text-fg3">{disk.percent.toFixed(0)}%</span>
        </span>
      </div>
      <Bar pct={disk.percent} color={color} delay={delay} />
    </div>
  )
}
