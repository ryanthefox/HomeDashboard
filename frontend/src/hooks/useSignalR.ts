import { useEffect } from 'react'
import * as signalR from '@microsoft/signalr'
import { connection, startConnection } from '@/lib/signalrClient'
import { queryClient } from '@/lib/queryClient'
import type { WeatherData, HueRoom, MediaInfo, SystemStats, AircoDevice } from '@/lib/api'

export function useSignalR() {
  useEffect(() => {
    startConnection().catch(console.error)

    const onWeather = (data: WeatherData)    => queryClient.setQueryData(['weather'], data)
    const onHue     = (data: HueRoom[])      => queryClient.setQueryData(['hue', 'rooms'], data)
    const onMusic   = (data: MediaInfo)      => queryClient.setQueryData(['music'], data)
    const onSystem  = (data: SystemStats)    => queryClient.setQueryData(['system'], data)
    const onAirco   = (data: AircoDevice[])  => queryClient.setQueryData(['airco', 'devices'], data)

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

  return { isConnected: connection.state === signalR.HubConnectionState.Connected }
}
