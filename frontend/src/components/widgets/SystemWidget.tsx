import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, HardDrive, Thermometer, Wifi } from 'lucide-react'
import { systemApi, type SystemStats, type DiskDriveInfo } from '@/lib/api'
import { ArcGauge } from '@/components/ui/ArcGauge'

export function formatBps(bps: number): string {
  if (bps < 1024)             return `${bps} B/s`
  if (bps < 1024 * 1024)      return `${(bps / 1024).toFixed(1)} KB/s`
  if (bps < 1024 * 1024 * 1024) return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`
  return `${(bps / (1024 * 1024 * 1024)).toFixed(2)} GB/s`
}

function formatGb(gb: number): string {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`
  return `${gb.toFixed(0)} GB`
}

function tempColor(t: number) {
  if (t > 85) return '#f87171'
  if (t > 70) return '#fb923c'
  if (t > 55) return '#facc15'
  return '#34d399'
}

export function SystemWidget() {
  const { data, isLoading } = useQuery<SystemStats>({
    queryKey: ['system'],
    queryFn: systemApi.getStats,
    refetchInterval: 3_000,
  })

  if (isLoading || !data) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Laden…</div>
  }

  const memLabel  = data.memoryTotalGb > 0
    ? `${data.memoryUsedGb.toFixed(1)} / ${data.memoryTotalGb.toFixed(0)} GB`
    : undefined
  const mainDisk  = data.disks[0]
  const diskLabel = mainDisk ? `${formatGb(mainDisk.usedGb)} / ${formatGb(mainDisk.totalGb)}` : undefined

  return (
    <div className="h-full overflow-y-auto scrollbar-hide space-y-4 pb-2">

      {/* ── Gauges row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GaugeCard
          label="CPU"
          value={data.cpuLoad}
          color="#38bdf8"
          sublabel={memLabel ? `${data.cpuLoad.toFixed(1)}%` : undefined}
          temp={data.cpuTemp}
        />
        <GaugeCard
          label="GPU"
          value={data.gpuLoad}
          color="#818cf8"
          temp={data.gpuTemp}
        />
        <GaugeCard
          label="Geheugen"
          value={data.memoryPercent}
          color="#38bdf8"
          sublabel={memLabel}
        />
        <GaugeCard
          label="Schijf"
          value={mainDisk?.percent ?? data.diskPercent}
          color={data.diskPercent > 85 ? '#f87171' : '#38bdf8'}
          sublabel={diskLabel}
        />
      </div>

      {/* ── Bottom row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Storage */}
        <div className="rounded-3xl bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="h-4 w-4 text-zinc-500" />
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Opslag</p>
          </div>
          {data.disks.length === 0
            ? <p className="text-xs text-zinc-600">Geen schijven gevonden</p>
            : data.disks.map(d => <DiskRow key={d.name} disk={d} />)
          }
        </div>

        {/* Network + Temps */}
        <div className="flex flex-col gap-4">

          {/* Network */}
          <div className="rounded-3xl bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wifi className="h-4 w-4 text-zinc-500" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Netwerk</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowDown className="h-3.5 w-3.5 text-sky-400" />
                  <p className="text-xs text-zinc-500">Download</p>
                </div>
                <p className="text-2xl font-bold text-fg">{formatBps(data.networkDownBps)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowUp className="h-3.5 w-3.5 text-violet-400" />
                  <p className="text-xs text-zinc-500">Upload</p>
                </div>
                <p className="text-2xl font-bold text-fg">{formatBps(data.networkUpBps)}</p>
              </div>
            </div>
          </div>

          {/* Temperatures */}
          {(data.cpuTemp > 0 || data.gpuTemp > 0) && (
            <div className="rounded-3xl bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="h-4 w-4 text-zinc-500" />
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Temperaturen</p>
              </div>
              <div className="space-y-3">
                {data.cpuTemp > 0 && <TempRow label="CPU" temp={data.cpuTemp} />}
                {data.gpuTemp > 0 && <TempRow label="GPU" temp={data.gpuTemp} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GaugeCard({ label, value, color, sublabel, temp }: {
  label: string; value: number; color: string; sublabel?: string; temp?: number
}) {
  return (
    <div className="rounded-3xl bg-card p-5 flex flex-col items-center justify-center gap-2">
      <ArcGauge label={label} value={value} color={color} sublabel={sublabel} size="xl" />
      {temp != null && temp > 0 && (
        <p className="text-sm font-semibold" style={{ color: tempColor(temp) }}>
          {Math.round(temp)}°C
        </p>
      )}
    </div>
  )
}

function DiskRow({ disk }: { disk: DiskDriveInfo }) {
  const color = disk.percent > 90 ? '#f87171' : disk.percent > 75 ? '#fb923c' : '#38bdf8'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fg">{disk.name}</span>
        <span className="text-xs text-zinc-400">
          {formatGb(disk.usedGb)} / {formatGb(disk.totalGb)}
          <span className="ml-2 text-zinc-600">{disk.percent.toFixed(0)}%</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-elev2">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(disk.percent, 100)}%`, background: color }} />
      </div>
    </div>
  )
}

function TempRow({ label, temp }: { label: string; temp: number }) {
  const color = tempColor(temp)
  const pct   = Math.min(temp / 100 * 100, 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{Math.round(temp)}°C</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-elev2">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
