import { useEffect, useSyncExternalStore } from 'react'
import * as signalR from '@microsoft/signalr'
import { connection, startConnection, subscribeConnection, getConnectionState } from '@/lib/signalrClient'
import { queryClient } from '@/lib/queryClient'
import type { WeatherData, HueRoom, MediaInfo, SystemStats, AircoDevice } from '@/lib/api'

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

    connection.on('WeatherUpdate', onWeather)
    connection.on('HueUpdate',     onHue)
    connection.on('MusicUpdate',   onMusic)
    connection.on('SystemUpdate',  onSystem)
    connection.on('AircoUpdate',   onAirco)

    return () => {
      connection.off('WeatherUpdate', onWeather)
      connection.off('HueUpdate',     onHue)
      connection.off('MusicUpdate',   onMusic)
      connection.off('SystemUpdate',  onSystem)
      connection.off('AircoUpdate',   onAirco)
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
