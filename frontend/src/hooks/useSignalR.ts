import { useEffect, useSyncExternalStore } from 'react'
import * as signalR from '@microsoft/signalr'
import { connection, startConnection, subscribeConnection, getConnectionState } from '@/lib/signalrClient'
import { queryClient } from '@/lib/queryClient'
import type { WeatherData, HueRoom, MediaInfo, SystemStats, AircoDevice, RingLiveEvent } from '@/lib/api'
import { emitRingEvent } from '@/lib/ring'

/** Wires SignalR push messages into the React Query cache. Mount once. */
export function useSignalR() {
  useEffect(() => {
    void startConnection()

    // Handlers must return void: SignalR treats a returned value as a client result and errors
    const onWeather = (data: WeatherData | null) => { if (data) queryClient.setQueryData(['weather'], data) }
    const onHue     = (data: HueRoom[])     => { queryClient.setQueryData(['hue', 'rooms'], data) }
    const onMusic   = (data: MediaInfo)     => { queryClient.setQueryData(['music'], data) }
    const onSystem  = (data: SystemStats)   => { queryClient.setQueryData(['system'], data) }
    const onAirco   = (data: AircoDevice[]) => { queryClient.setQueryData(['airco', 'devices'], data) }
    const onRing    = (e: RingLiveEvent)    => { emitRingEvent(e); void queryClient.invalidateQueries({ queryKey: ['ring'] }) }

    connection.on('WeatherUpdate', onWeather)
    connection.on('HueUpdate',     onHue)
    connection.on('MusicUpdate',   onMusic)
    connection.on('SystemUpdate',  onSystem)
    connection.on('AircoUpdate',   onAirco)
    connection.on('RingEvent',     onRing)

    return () => {
      connection.off('WeatherUpdate', onWeather)
      connection.off('HueUpdate',     onHue)
      connection.off('MusicUpdate',   onMusic)
      connection.off('SystemUpdate',  onSystem)
      connection.off('AircoUpdate',   onAirco)
      connection.off('RingEvent',     onRing)
    }
  }, [])
}

/** Reactive connection state (re-renders only when it changes). */
export function useConnectionState() {
  const state = useSyncExternalStore(subscribeConnection, getConnectionState)
  return {
    state,
    isConnected: state === signalR.HubConnectionState.Connected,
  }
}
