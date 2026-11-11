import { useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Snowflake, Flame, Fan, Droplets, RefreshCw } from 'lucide-react'
import { aircoApi, type AircoDevice } from '@/lib/api'

const KEY = ['airco', 'devices'] as const
export const TEMP_MIN = 16
export const TEMP_MAX = 30

export const AIRCO_MODES = [
  { id: 'cool', label: 'Koelen',     short: 'Koel',  icon: Snowflake, color: '#5ec8ff' },
  { id: 'heat', label: 'Verwarmen',  short: 'Warm',  icon: Flame,     color: '#ff8a4c' },
  { id: 'fan',  label: 'Ventilatie', short: 'Fan',   icon: Fan,       color: '#c4c4cc' },
  { id: 'dry',  label: 'Drogen',     short: 'Droog', icon: Droplets,  color: '#93c5fd' },
  { id: 'auto', label: 'Auto',       short: 'Auto',  icon: RefreshCw, color: '#34d399' },
] as const

export const FAN_SPEEDS = [
  { id: 0, label: 'Auto' },
  { id: 2, label: 'Laag' },
  { id: 3, label: 'Midden' },
  { id: 4, label: 'Hoog' },
  { id: 6, label: 'Turbo' },
] as const

export const modeColor = (mode: string) => AIRCO_MODES.find(m => m.id === mode)?.color ?? '#5ec8ff'
export const modeLabel = (mode: string) => AIRCO_MODES.find(m => m.id === mode)?.label ?? ''

/** Optimistic airco commands. Temperature taps are debounced into one call. */
export function useAircoActions(device: AircoDevice | undefined) {
  const qc = useQueryClient()
  const tempTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const patch = (p: Partial<AircoDevice>) => {
    if (!device) return
    qc.setQueryData<AircoDevice[]>(KEY, old =>
      old?.map(d => d.deviceId === device.deviceId ? { ...d, ...p } : d) ?? old)
  }
  // After a command, re-read the real state (the backend drops its cache on writes)
  const settle = () => setTimeout(() => { void qc.invalidateQueries({ queryKey: KEY }) }, 1500)
  const fail   = () => { void qc.invalidateQueries({ queryKey: KEY }) }

  return {
    setPower(on: boolean) {
      if (!device) return
      patch({ isOn: on })
      aircoApi.setPower(device.deviceId, on).then(settle, fail)
    },
    stepTemp(delta: number) {
      if (!device) return
      const current = qc.getQueryData<AircoDevice[]>(KEY)?.find(d => d.deviceId === device.deviceId)?.targetTemperature
        ?? device.targetTemperature
      const next = Math.min(TEMP_MAX, Math.max(TEMP_MIN, current + delta))
      if (next === current) return
      patch({ targetTemperature: next })
      if (tempTimer.current) clearTimeout(tempTimer.current)
      const id = device.deviceId
      tempTimer.current = setTimeout(() => {
        aircoApi.setTemperature(id, next).then(settle, fail)
      }, 600)
    },
    setMode(mode: string) {
      if (!device) return
      patch({ mode })
      aircoApi.setMode(device.deviceId, mode).then(settle, fail)
    },
    setFan(speed: number) {
      if (!device) return
      patch({ fanSpeed: speed })
      aircoApi.setFanSpeed(device.deviceId, speed).then(settle, fail)
    },
  }
}
