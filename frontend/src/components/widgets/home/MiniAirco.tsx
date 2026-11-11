import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Power, Wind, Minus, Plus, AirVent } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aircoApi, type AircoDevice } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useAircoActions, AIRCO_MODES, FAN_SPEEDS, TEMP_MIN, TEMP_MAX, modeColor } from '@/lib/airco'
import { ThermostatRing } from '@/components/ui/ThermostatRing'
import { Press, spring, EmptyState } from '@/components/ui/motion'
import { useContainerSize, TileHeader } from './shared'
import { AIRCO_VISIBLE_KEY, pickVisible } from './TileConfig'

/** Power button that glows in the current mode's colour. */
export function PowerButton({ on, color, onClick, disabled, size = 36 }: {
  on: boolean; color: string; onClick: () => void; disabled?: boolean; size?: number
}) {
  return (
    <Press onClick={onClick} disabled={disabled}
      className={cn('flex shrink-0 items-center justify-center rounded-full transition-colors duration-300 disabled:opacity-40',
        on ? 'text-white' : 'bg-card3 text-fg3 hover:text-fg2')}
      style={{
        width: size, height: size,
        background: on ? `linear-gradient(135deg, ${color}, ${color}bb)` : undefined,
        boxShadow: on ? `0 0 22px -2px ${color}aa, inset 0 1px 0 rgba(255,255,255,.3)` : undefined,
      }}>
      <Power className="h-[42%] w-[42%]" strokeWidth={2.5} />
    </Press>
  )
}

export function TempStepper({ device, onStep, size = 'md' }: {
  device: AircoDevice; onStep: (d: number) => void; size?: 'sm' | 'md'
}) {
  const btn = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  return (
    <div className="flex items-center gap-2">
      <Press onClick={() => onStep(-1)} disabled={!device.isOn || device.targetTemperature <= TEMP_MIN}
        className={cn(btn, 'flex items-center justify-center rounded-full bg-card4 text-fg2 hover:text-fg disabled:opacity-30')}>
        <Minus className="h-4 w-4" />
      </Press>
      <Press onClick={() => onStep(1)} disabled={!device.isOn || device.targetTemperature >= TEMP_MAX}
        className={cn(btn, 'flex items-center justify-center rounded-full bg-card4 text-fg2 hover:text-fg disabled:opacity-30')}>
        <Plus className="h-4 w-4" />
      </Press>
    </div>
  )
}

export function MiniAirco() {
  const ref = useRef<HTMLDivElement>(null)
  const { h, w } = useContainerSize(ref)
  const { data: allDevices } = useQuery<AircoDevice[]>({ queryKey: ['airco', 'devices'], queryFn: aircoApi.getDevices, staleTime: 30_000 })
  const [visibleIds] = useLocalStorage<string[]>(AIRCO_VISIBLE_KEY, [])
  const devices = pickVisible(allDevices, visibleIds, d => d.deviceId)
  const [selectedId, setSelectedId] = useLocalStorage<string>('home-ac-device', '')
  const device = devices.find(d => d.deviceId === selectedId) ?? devices[0]
  const act = useAircoActions(device)
  const color = device ? modeColor(device.mode) : '#5ec8ff'

  const tiny      = h < 170 || w < 140
  const showRing  = !tiny && h >= 250 && w >= 170
  const showModes = showRing && h >= 340
  const narrow    = w < 240
  const showFan   = h > 440 && w >= 200

  return (
    <div ref={ref} className="flex h-full flex-col p-4">
      <TileHeader icon={<AirVent />} title={devices.length === 1 && device ? device.name : 'Airco'}
        right={device && <PowerButton on={device.isOn} color={color} onClick={() => act.setPower(!device.isOn)} disabled={!device.isOnline} size={34} />} />

      {!tiny && devices.length > 1 && (
        <div className="mb-2 flex shrink-0 gap-1 rounded-xl bg-card3 p-0.5">
          {devices.map(d => {
            const active = device?.deviceId === d.deviceId
            return (
              <button key={d.deviceId} onClick={() => setSelectedId(d.deviceId)}
                className={cn('relative flex-1 truncate rounded-lg px-2 py-1 text-xs font-medium transition-colors', active ? 'text-zinc-950' : 'text-fg2 hover:text-fg')}>
                {active && <motion.span layoutId="mini-ac-dev" transition={spring} className="absolute inset-0 rounded-lg bg-white" />}
                <span className="relative z-10">{d.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {devices.length === 0 || !device ? (
        <EmptyState icon={<AirVent className="h-5 w-5" />} title="Airco niet gekoppeld" hint="Open het Airco-tabblad voor de instructies" />
      ) : (
        <>
          {showRing ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <ThermostatRing className="max-h-full max-w-[220px]" target={device.targetTemperature} current={device.currentTemperature} mode={device.mode} isOn={device.isOn} />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className={cn('font-semibold tracking-[-0.04em] tabular', tiny ? 'text-3xl' : 'text-5xl', device.isOn ? 'text-fg' : 'text-fg3')}>
                {device.targetTemperature}°
              </p>
            </div>
          )}

          <div className={cn('flex shrink-0 items-center', tiny ? 'justify-center' : 'justify-between', 'mt-2')}>
            {!tiny && (
              <div className="min-w-0">
                <p className="label-caps">Kamer</p>
                <p className="text-lg font-semibold text-fg2 tabular">{device.currentTemperature > 0 ? `${device.currentTemperature}°` : '–'}</p>
              </div>
            )}
            <TempStepper device={device} onStep={act.stepTemp} size="sm" />
          </div>

          {showModes && (
            <div className={cn('mt-3 grid shrink-0 gap-1', narrow ? 'grid-cols-5' : 'grid-cols-5')}>
              {AIRCO_MODES.map(m => {
                const active = device.mode === m.id
                const Icon = m.icon
                return (
                  <Press key={m.id} onClick={() => act.setMode(m.id)} disabled={!device.isOn}
                    className={cn('relative flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-colors disabled:opacity-30',
                      active ? 'text-fg' : 'bg-card3 text-fg3 hover:text-fg2')}>
                    {active && (
                      <motion.span layoutId="mini-ac-mode" transition={spring} className="absolute inset-0 rounded-xl"
                        style={{ background: `${m.color}22`, boxShadow: `inset 0 0 0 1px ${m.color}66, 0 0 16px -4px ${m.color}88` }} />
                    )}
                    <Icon className="relative z-10 h-4 w-4" style={{ color: active ? m.color : undefined }} />
                    {!narrow && <span className="relative z-10 leading-none">{m.short}</span>}
                  </Press>
                )
              })}
            </div>
          )}

          {showFan && (
            <div className="mt-3 shrink-0">
              <p className="mb-1.5 flex items-center gap-1 label-caps"><Wind className="h-3 w-3" /> Ventilator</p>
              <div className="grid grid-cols-5 gap-1 rounded-xl bg-card3 p-0.5">
                {FAN_SPEEDS.map(s => {
                  const active = device.fanSpeed === s.id
                  return (
                    <button key={s.id} onClick={() => act.setFan(s.id)} disabled={!device.isOn}
                      className={cn('relative rounded-lg py-1.5 text-[11px] font-medium transition-colors disabled:opacity-30', active ? 'text-zinc-950' : 'text-fg2 hover:text-fg')}>
                      {active && <motion.span layoutId="mini-ac-fan" transition={spring} className="absolute inset-0 rounded-lg bg-white" />}
                      <span className="relative z-10">{s.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
