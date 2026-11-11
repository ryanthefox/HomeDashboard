import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Boxes, Clock, Cpu, Server, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { serverApi, type ContainerInfo, type ServerStatus as Status } from '@/lib/api'
import { formatUptime } from '@/lib/pc'
import { Panel, Label, Skeleton } from '@/components/ui/motion'

function stateOf(c: ContainerInfo): { color: string; label: string } {
  if (c.state === 'running' && c.health === 'unhealthy') return { color: '#f87171', label: 'Ongezond' }
  if (c.state === 'running' && c.health === 'starting') return { color: '#fbbf24', label: 'Start op' }
  if (c.state === 'running') return { color: '#34d399', label: 'Draait' }
  if (c.state === 'restarting') return { color: '#fbbf24', label: 'Herstart' }
  if (c.state === 'paused') return { color: '#a1a1aa', label: 'Gepauzeerd' }
  if (c.state === 'created') return { color: '#a1a1aa', label: 'Aangemaakt' }
  return { color: '#f87171', label: 'Gestopt' }
}

/** Docker's status text ("Up 3 days (healthy)", "Exited (0) 2 hours ago") in Dutch. */
function statusText(s: string) {
  return s
    .replace(/\s*\((healthy|unhealthy|health: starting)\)/, '')
    .replace(/^Up /, 'Actief ').replace(/^Exited \((\d+)\) /, 'Gestopt (code $1) ').replace(/^Created/, 'Aangemaakt')
    .replace(/About an? /g, '1 ').replace(/Less than a second/, 'minder dan een seconde')
    .replace(/\bseconds?\b/g, 'sec').replace(/\bminutes?\b/g, 'min').replace(/\bhours?\b/g, 'uur')
    .replace(/\bdays?\b/g, 'dagen').replace(/\bweeks?\b/g, 'weken').replace(/\bmonths?\b/g, 'maanden').replace(/\bago\b/, 'geleden')
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl bg-card3 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] text-fg3 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-fg tabular">{value}</p>
    </div>
  )
}

const COLLAPSED = 8

export function ServerStatusPanel({ index = 7 }: { index?: number }) {
  const { data, isLoading } = useQuery<Status>({
    queryKey: ['server', 'status'], queryFn: serverApi.getStatus,
    refetchInterval: 30_000, staleTime: 15_000,
  })
  const [open, setOpen] = useState(false)

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />
  if (!data) return null

  const d = data.docker
  const containers = open ? d.containers : d.containers.slice(0, COLLAPSED)
  const problems = d.containers.filter(c => c.state !== 'running' || c.health === 'unhealthy').length
  const load = data.load.length ? data.load.map(l => l.toFixed(2)).join(' · ') : '–'

  return (
    <Panel index={index} className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Label icon={<Server />}>Server</Label>
        {d.available && (
          <span className={cn('rounded-lg px-2 py-1 text-[11px] font-semibold', problems ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300')}>
            {problems ? `${problems} container${problems > 1 ? 's' : ''} niet actief` : 'Alles draait'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat icon={<Server />} label="Naam" value={data.hostname} />
        <Stat icon={<Clock />} label="Aan sinds" value={formatUptime(data.uptimeSeconds) || '–'} />
        <Stat icon={<Cpu />} label={`Belasting (${data.cpuCount} cores)`} value={load} />
        <Stat icon={<Boxes />} label="Containers" value={d.available ? `${d.running} actief${d.stopped ? ` · ${d.stopped} gestopt` : ''}` : '–'} />
      </div>
      {(data.os || data.kernel) && (
        <p className="mt-2 truncate px-1 text-[11px] text-fg3">
          {data.os}{data.kernel ? ` · kernel ${data.kernel}` : ''}{d.version ? ` · Docker ${d.version}` : ''}
        </p>
      )}

      <div className="mt-4">
        {!d.available ? (
          <p className="rounded-2xl bg-card3 px-3 py-3 text-xs text-fg3">
            {d.error ?? 'Docker niet beschikbaar'} — koppel <code className="text-fg2">/var/run/docker.sock</code> in docker-compose.yml om je containers te zien.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
            {containers.map((c, i) => {
              const st = stateOf(c)
              return (
                <motion.div key={c.name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.02 }}
                  className="flex items-center gap-2.5 rounded-xl bg-card3 px-3 py-2" title={c.image}>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: st.color, boxShadow: `0 0 8px ${st.color}` }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{c.name}</p>
                    <p className="truncate text-[11px] text-fg3">{statusText(c.status)}</p>
                  </div>
                  {c.project && <span className="hidden shrink-0 rounded-md bg-card4 px-1.5 py-0.5 text-[10px] text-fg3 sm:inline">{c.project}</span>}
                  <span className="shrink-0 text-[11px] font-medium" style={{ color: st.color }}>{st.label}</span>
                </motion.div>
              )
            })}
          </div>
        )}
        {d.containers.length > COLLAPSED && (
          <button onClick={() => setOpen(o => !o)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-fg3 hover:text-fg">
            {open ? 'Minder tonen' : `Alle ${d.containers.length} containers`}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>
    </Panel>
  )
}
