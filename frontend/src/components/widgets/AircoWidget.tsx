import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Power, Wind, Thermometer, WashingMachine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aircoApi, washerApi, type AircoDevice, type WasherDevice } from '@/lib/api'

const MODES = [
  { id: 'cool', label: 'Koelen',    emoji: '❄️' },
  { id: 'heat', label: 'Verwarmen', emoji: '🔥' },
  { id: 'fan',  label: 'Ventilatie', emoji: '💨' },
  { id: 'dry',  label: 'Ontvochtigen', emoji: '💧' },
  { id: 'auto', label: 'Auto',      emoji: '♻️' },
]

const FAN_SPEEDS = [
  { id: 0, label: 'Auto' },
  { id: 2, label: 'Laag' },
  { id: 3, label: 'Midden' },
  { id: 4, label: 'Hoog' },
  { id: 6, label: 'Turbo' },
]

function AircoSetupPrompt() {
  return (
    <div className="mx-auto max-w-sm flex flex-col gap-4 py-12 px-2">
      <div className="flex flex-col items-center gap-3 text-center">
        <Thermometer className="h-10 w-10 text-zinc-600" />
        <p className="text-base font-semibold text-fg">Airco configureren</p>
        <p className="text-xs text-zinc-500">Voeg je LG ThinQ Personal Access Token toe aan appsettings.json</p>
      </div>
      <div className="rounded-2xl bg-card3 p-4 space-y-2.5 text-xs text-zinc-400">
        <p className="font-medium text-zinc-300">Stap 1 — PAT aanmaken</p>
        <p>Ga naar <span className="text-orange-400">smartsolution.developer.lge.com</span> → Log in met je LG account → maak een Personal Access Token aan met alle scopes.</p>
        <p className="font-medium text-zinc-300 pt-1">Stap 2 — DeviceId vinden</p>
        <p>Start de backend en roep <span className="text-orange-400">/api/airco/devices/all</span> aan — je ziet dan je device ID in de response.</p>
        <p className="font-medium text-zinc-300 pt-1">Stap 3 — appsettings.json</p>
        <pre className="bg-[#111] rounded-lg p-2 text-[10px] text-zinc-400 overflow-x-auto whitespace-pre-wrap">{`"LgThinq": {
  "PersonalAccessToken": "jouw-pat",
  "CountryCode": "NL",
  "ClientId": "genereer-een-uuid",
  "BaseUrl": "https://api-eic.lgthinq.com"
}`}</pre>
      </div>
    </div>
  )
}

// ── Washer state helpers ───────────────────────────────────────────────────────
const WASHER_STATE_LABEL: Record<string, string> = {
  standby:  'Standby',
  running:  'Bezig',
  pause:    'Gepauzeerd',
  rinsing:  'Spoelen',
  spinning: 'Centrifugeren',
  drying:   'Drogen',
  cooling:  'Afkoelen',
  steam:    'Stoomverzachten',
  end:      'Klaar',
  error:    'Fout',
}

const WASHER_STATE_COLOR: Record<string, string> = {
  standby:  'text-zinc-500',
  running:  'text-blue-400',
  pause:    'text-amber-400',
  rinsing:  'text-cyan-400',
  spinning: 'text-violet-400',
  drying:   'text-orange-400',
  cooling:  'text-sky-400',
  steam:    'text-teal-400',
  end:      'text-emerald-400',
  error:    'text-red-400',
}

function formatRemaining(minutes: number) {
  if (minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}u ${m}m` : `${m}m`
}

function WasherSection({ washers }: { washers: WasherDevice[] }) {
  if (washers.length === 0) return null

  return (
    <div className="rounded-3xl bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <WashingMachine className="h-4 w-4 text-zinc-500" />
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Wasmachine</p>
      </div>

      {washers.map(w => {
        const stateLabel = WASHER_STATE_LABEL[w.runState] ?? w.runState
        const stateColor = WASHER_STATE_COLOR[w.runState] ?? 'text-zinc-400'
        const remaining  = formatRemaining(w.remainingMinutes)
        const isActive   = !['standby', 'end', 'error'].includes(w.runState)

        return (
          <div key={w.deviceId} className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className={cn('h-1.5 w-1.5 rounded-full', w.isOnline ? 'bg-emerald-500' : 'bg-zinc-600')} />
                <p className="text-sm font-medium text-fg">{w.name}</p>
              </div>
              {w.cycle && isActive && (
                <p className="text-xs text-zinc-500 mt-0.5 pl-3.5">{w.cycle}</p>
              )}
            </div>
            <div className="text-right">
              <p className={cn('text-sm font-semibold', stateColor)}>{stateLabel}</p>
              {remaining && (
                <p className="text-xs text-zinc-500 mt-0.5">{remaining} over</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AircoWidget() {
  const qc = useQueryClient()
  const { data: devices = [], isLoading } = useQuery<AircoDevice[]>({
    queryKey: ['airco', 'devices'],
    queryFn: aircoApi.getDevices,
    staleTime: 5 * 60_000,   // 5 min — avoid hitting LG rate limits
  })
  const { data: washers = [] } = useQuery<WasherDevice[]>({
    queryKey: ['washer', 'devices'],
    queryFn: washerApi.getDevices,
    refetchInterval: 30_000,
  })

  const [selectedId, setSelectedId] = useState<string>('')
  const device = devices.find(d => d.deviceId === selectedId) ?? devices[0]

  const invalidate = () => qc.invalidateQueries({ queryKey: ['airco', 'devices'] })

  const power   = useMutation({ mutationFn: (on: boolean) => aircoApi.setPower(device!.deviceId, on),       onSuccess: invalidate })
  const setTemp = useMutation({ mutationFn: (t: number)   => aircoApi.setTemperature(device!.deviceId, t),  onSuccess: invalidate })
  const setMode = useMutation({ mutationFn: (m: string)   => aircoApi.setMode(device!.deviceId, m),         onSuccess: invalidate })
  const setFan  = useMutation({ mutationFn: (s: number)   => aircoApi.setFanSpeed(device!.deviceId, s),     onSuccess: invalidate })

  if (isLoading) return <div className="flex h-64 items-center justify-center text-zinc-500">Laden…</div>

  if (devices.length === 0) return (
    <div className="mx-auto max-w-xl space-y-4">
      <AircoSetupPrompt />
      <WasherSection washers={washers} />
    </div>
  )

  return (
    <div className="mx-auto max-w-xl space-y-4">

      {/* Device selector */}
      {devices.length > 1 && (
        <div className="flex gap-2">
          {devices.map(d => (
            <button key={d.deviceId} onClick={() => setSelectedId(d.deviceId)}
              className={cn('flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all',
                (device?.deviceId === d.deviceId) ? 'bg-white text-black' : 'bg-card text-zinc-400 hover:text-zinc-200')}>
              {d.name}
            </button>
          ))}
        </div>
      )}

      {device && (
        <>
          {/* Main card */}
          <div className={cn('rounded-3xl p-8 transition-colors', device.isOn ? 'bg-card' : 'bg-[#141414]')}>
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-sm text-zinc-500">{device.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn('h-1.5 w-1.5 rounded-full', device.isOnline ? 'bg-emerald-500' : 'bg-zinc-600')} />
                  <p className="text-xs text-zinc-500">{device.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <button
                onClick={() => power.mutate(!device.isOn)}
                disabled={power.isPending || !device.isOnline}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full transition-all',
                  device.isOn
                    ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)]'
                    : 'bg-elev2 text-zinc-500 hover:text-zinc-300',
                  'disabled:opacity-40'
                )}
              >
                <Power className="h-5 w-5" />
              </button>
            </div>

            {/* Temperature display */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs text-zinc-600 mb-1">Huidig</p>
                <p className="text-6xl font-bold text-fg tracking-tighter">
                  {device.currentTemperature > 0 ? `${device.currentTemperature}°` : '–°'}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-zinc-500">Doel</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTemp.mutate(device.targetTemperature - 1)}
                    disabled={!device.isOn || setTemp.isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-elev2 text-zinc-300 hover:bg-[#333] disabled:opacity-30 text-lg font-bold"
                  >−</button>
                  <p className="text-3xl font-bold text-fg w-16 text-center">{device.targetTemperature}°</p>
                  <button
                    onClick={() => setTemp.mutate(device.targetTemperature + 1)}
                    disabled={!device.isOn || setTemp.isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-elev2 text-zinc-300 hover:bg-[#333] disabled:opacity-30 text-lg font-bold"
                  >+</button>
                </div>
              </div>
            </div>

            {/* Mode selector */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">Stand</p>
              <div className="flex gap-2">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setMode.mutate(m.id)}
                    disabled={!device.isOn || setMode.isPending}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 rounded-2xl py-3 text-xs font-medium transition-all disabled:opacity-30',
                      device.mode === m.id
                        ? 'bg-white text-black'
                        : 'bg-elev text-zinc-400 hover:text-zinc-200 hover:bg-elev2'
                    )}
                  >
                    <span className="text-base">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fan speed */}
          <div className="rounded-3xl bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wind className="h-4 w-4 text-zinc-500" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Ventilatorsnelheid</p>
            </div>
            <div className="flex gap-2">
              {FAN_SPEEDS.map(s => (
                <button key={s.id} onClick={() => setFan.mutate(s.id)}
                  disabled={!device.isOn || setFan.isPending}
                  className={cn(
                    'flex-1 rounded-xl py-2 text-xs font-medium transition-all disabled:opacity-30',
                    device.fanSpeed === s.id
                      ? 'bg-white text-black'
                      : 'bg-elev text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <WasherSection washers={washers} />
    </div>
  )
}
