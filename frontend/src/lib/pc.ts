import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pcApi, systemApi, type PcPowerCommand, type PcStatus, type SystemStats } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export function usePcStatus() {
  return useQuery<PcStatus>({
    queryKey: ['pc', 'status'],
    queryFn: pcApi.getStatus,
    // Poll faster while the PC is starting up or shutting down
    refetchInterval: q => (q.state.data?.state === 'waking' || q.state.data?.state === 'stopping' ? 2_000 : 5_000),
    staleTime: 2_000,
  })
}

export type SystemSource = 'pc' | 'server'

/**
 * Which machine the system widgets show.
 * "pc" (default) shows the PC whenever it's online and falls back to the server otherwise;
 * "server" always shows the server.
 */
export function useSystemSource() {
  const [preferred, setPreferred] = useLocalStorage<SystemSource>('system-source', 'pc')
  const { data: pc } = usePcStatus()

  const pcAvailable = !!pc?.configured && pc.hasAgent
  const showPc      = pcAvailable && preferred === 'pc' && pc!.state === 'online'

  const server = useQuery<SystemStats>({ queryKey: ['system'], queryFn: systemApi.getStats, refetchInterval: 3_000 })
  const pcStats = useQuery<SystemStats | null>({
    queryKey: ['pc', 'stats'], queryFn: pcApi.getStats, refetchInterval: 2_000, enabled: showPc,
  })

  // While the PC's first stats are loading, keep showing the server instead of a blank widget
  const usePcData = showPc && !!pcStats.data
  return {
    pc,
    pcAvailable,
    preferred,
    setPreferred,
    source: (usePcData ? 'pc' : 'server') as SystemSource,
    data:   usePcData ? pcStats.data! : server.data,
    isLoading: !server.data && !(usePcData && pcStats.data),
    sourceLabel: usePcData ? (pc?.name ?? 'PC') : 'Server',
  }
}

export function usePcActions() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['pc', 'status'] })
  const wake  = useMutation({ mutationFn: pcApi.wake, onSettled: refresh })
  const power = useMutation({ mutationFn: (cmd: PcPowerCommand) => pcApi.power(cmd), onSettled: refresh })
  return { wake, power }
}

export function formatUptime(seconds: number | null | undefined): string | null {
  if (!seconds) return null
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}u`
  if (h > 0) return `${h}u ${m}m`
  return `${m}m`
}
