import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Wind, AirVent } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aircoApi, type AircoDevice } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useAircoActions, AIRCO_MODES, FAN_SPEEDS, modeColor } from '@/lib/airco'
import { ThermostatRing } from '@/components/ui/ThermostatRing'
import { Panel, Press, Segmented, Label, Skeleton, spring } from '@/components/ui/motion'
import { PowerButton, TempStepper } from './home/MiniAirco'

function AircoSetupPrompt() {
  return (
    <Panel className="mx-auto mt-6 flex max-w-md flex-col gap-4 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card3 text-fg2"><AirVent className="h-7 w-7" /></div>
        <p className="text-base font-semibold text-fg">Airco koppelen</p>
        <p className="text-xs text-fg3">Voeg je LG ThinQ Personal Access Token toe aan appsettings.json</p>
      </div>
      <div className="space-y-2.5 rounded-2xl bg-card3 p-4 text-xs text-fg2">
        <p className="font-semibold text-fg">1 — PAT aanmaken</p>
        <p>Ga naar <span className="text-orange-400">smartsolution.developer.lge.com</span>, log in en maak een Personal Access Token met alle scopes.</p>
        <p className="pt-1 font-semibold text-fg">2 — DeviceId vinden</p>
        <p>Start de backend en open <span className="text-orange-400">/api/airco/devices/all</span>.</p>
        <p className="pt-1 font-semibold text-fg">3 — appsettings.json</p>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/40 p-2 text-[10px] text-zinc-300">{`"LgThinq": {
  "PersonalAccessToken": "jouw-pat",
  "CountryCode": "NL",
  "ClientId": "genereer-een-uuid",
  "BaseUrl": "https://api-eic.lgthinq.com"
}`}</pre>
      </div>
    </Panel>
  )
}

export function AircoWidget() {
  const { data: devices = [], isLoading } = useQuery<AircoDevice[]>({
    queryKey: ['airco', 'devices'], queryFn: aircoApi.getDevices,
    staleTime: 5 * 60_000, // avoid hitting LG rate limits
  })
  const [selectedId, setSelectedId] = useLocalStorage<string>('home-ac-device', '')
  const device = devices.find(d => d.deviceId === selectedId) ?? devices[0]
  const act = useAircoActions(device)

  if (isLoading) return <div className="mx-auto max-w-xl"><Skeleton className="h-[480px] rounded-3xl" /></div>
  if (devices.length === 0 || !device) return <div className="h-full overflow-y-auto scrollbar-hide"><AircoSetupPrompt /></div>

  const color = modeColor(device.mode)

  return (
    <div className="flex h-full w-full flex-col">
      {devices.length > 1 && (
        <div className="mb-3 flex shrink-0 justify-center overflow-x-auto scrollbar-hide">
          <Segmented layoutId="ac-device" value={device.deviceId} onChange={setSelectedId}
            items={devices.map(d => ({ id: d.deviceId, label: d.name }))} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="mx-auto grid max-w-4xl gap-4 pb-4 md:grid-cols-[1.2fr_1fr]">
          {/* Dial card */}
          <Panel className="relative overflow-hidden p-6 sm:p-8">
            <motion.div className="pointer-events-none absolute -top-1/3 left-1/2 h-2/3 w-2/3 -translate-x-1/2 rounded-full blur-3xl"
              animate={{ backgroundColor: color, opacity: device.isOn ? 0.18 : 0.03 }} transition={{ duration: 0.8 }} />
            <div className="relative mb-4 flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-fg">{device.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-fg3">
                  <span className={cn('h-1.5 w-1.5 rounded-full', device.isOnline ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-zinc-500')} />
                  {device.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              <PowerButton on={device.isOn} color={color} onClick={() => act.setPower(!device.isOn)} disabled={!device.isOnline} size={52} />
            </div>

            <ThermostatRing className="max-w-[300px]" target={device.targetTemperature} current={device.currentTemperature} mode={device.mode} isOn={device.isOn} />

            <div className="relative mt-4 flex items-center justify-between">
              <div>
                <p className="label-caps">Kamer</p>
                <p className="text-3xl font-semibold tracking-tight text-fg tabular">
                  {device.currentTemperature > 0 ? `${device.currentTemperature}°` : '–'}
                </p>
              </div>
              <TempStepper device={device} onStep={act.stepTemp} />
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            {/* Modes */}
            <Panel index={1} className="p-5">
              <Label className="mb-3">Stand</Label>
              <div className="grid grid-cols-5 gap-2 md:grid-cols-1 md:gap-1.5">
                {AIRCO_MODES.map(m => {
                  const active = device.mode === m.id
                  const Icon = m.icon
                  return (
                    <Press key={m.id} onClick={() => act.setMode(m.id)} disabled={!device.isOn}
                      className={cn('relative flex flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-medium transition-colors disabled:opacity-30 md:flex-row md:gap-3 md:px-4',
                        active ? 'text-fg' : 'bg-card3 text-fg2 hover:text-fg')}>
                      {active && (
                        <motion.span layoutId="ac-mode" transition={spring} className="absolute inset-0 rounded-2xl"
                          style={{ background: `${m.color}22`, boxShadow: `inset 0 0 0 1px ${m.color}66, 0 0 24px -6px ${m.color}` }} />
                      )}
                      <Icon className="relative z-10 h-5 w-5" style={{ color: active ? m.color : undefined }} />
                      <span className="relative z-10">{m.label}</span>
                    </Press>
                  )
                })}
              </div>
            </Panel>

            {/* Fan speed */}
            <Panel index={2} className="p-5">
              <Label icon={<Wind />} className="mb-3">Ventilator</Label>
              <Segmented layoutId="ac-fan" size="sm" value={device.fanSpeed} onChange={v => device.isOn && act.setFan(v)}
                className={cn('w-full', !device.isOn && 'pointer-events-none opacity-40')} itemClassName="flex-1 py-2"
                items={FAN_SPEEDS.map(s => ({ id: s.id, label: s.label }))} />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
