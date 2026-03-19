const BASE = '/api'

async function json<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

// ── Weather ──────────────────────────────────────────────────────────────────
export const weatherApi = {
  getCurrent: () => json<WeatherData>(`${BASE}/weather`),
}

// ── Hue ──────────────────────────────────────────────────────────────────────
export const hueApi = {
  getRooms: () => json<HueRoom[]>(`${BASE}/hue/rooms`),
  getLights: () => json<HueLight[]>(`${BASE}/hue/lights`),
  setLightState: (id: string, state: HueLightStateRequest) =>
    fetch(`${BASE}/hue/lights/${id}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }),
  setGroupAction: (groupId: string, on: boolean) =>
    fetch(`${BASE}/hue/groups/${groupId}/action`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on }),
    }),
  getScenes: (groupId: string) => json<HueScene[]>(`${BASE}/hue/groups/${groupId}/scenes`),
  activateScene: (groupId: string, sceneId: string) =>
    fetch(`${BASE}/hue/groups/${groupId}/scene/${sceneId}`, { method: 'PUT' }),
}

// ── Music ─────────────────────────────────────────────────────────────────────
export const musicApi = {
  getCurrent: () => json<MediaInfo>(`${BASE}/music`),
  play: () => fetch(`${BASE}/music/play`, { method: 'POST' }),
  pause: () => fetch(`${BASE}/music/pause`, { method: 'POST' }),
  next: () => fetch(`${BASE}/music/next`, { method: 'POST' }),
  prev: () => fetch(`${BASE}/music/prev`, { method: 'POST' }),
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface WeatherData {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  windGusts: number
  precipitation: number
  isDay: boolean
  weatherCode: number
  condition: string
  icon: string
  updatedAt: string
  uvIndex: number
  sunriseTime: string
  sunsetTime: string
  grassPollen?: number
  treePollen?: number
  hourly: HourlyForecastItem[]
  daily: DailyForecastItem[]
}

export interface DailyForecastItem {
  date: string
  tempMax: number
  tempMin: number
  weatherCode: number
  icon: string
  precipitationProbability: number
  precipitationSum: number
}

export interface HourlyForecastItem {
  time: string
  temperature: number
  precipitationProbability: number
  weatherCode: number
  icon: string
}

export interface HueLight {
  id: string
  name: string
  isOn: boolean
  brightness: number
  colorHue: number | null
  colorSat: number | null
  colorTemp: number | null
  isReachable: boolean
  type: string
}

export interface HueRoom {
  id: string
  name: string
  lights: HueLight[]
  anyOn: boolean
  allOn: boolean
}

export interface HueLightStateRequest {
  on?: boolean
  brightness?: number
  hue?: number
  sat?: number
  ct?: number
}

export const systemApi = {
  getStats: () => json<SystemStats>(`${BASE}/system`),
}

// ── Audio ──────────────────────────────────────────────────────────────────────
export const audioApi = {
  getOutputs: () => json<AudioOutputDevice[]>(`${BASE}/audio/outputs`),
  setDefault: (deviceId: string) =>
    fetch(`${BASE}/audio/outputs/default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    }),
}

export interface AudioOutputDevice {
  id: string
  name: string
  isDefault: boolean
}

// ── Airco ──────────────────────────────────────────────────────────────────────
export const aircoApi = {
  getDevices: () => json<AircoDevice[]>(`${BASE}/airco/devices`),
  getSetupUrl: () => json<{ authUrl: string }>(`${BASE}/airco/setup`),
  submitManualCode: (code: string, state: string) =>
    json<{ success: boolean }>(`${BASE}/airco/setup/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    }),
  setPower:       (deviceId: string, on: boolean)       => fetch(`${BASE}/airco/devices/${encodeURIComponent(deviceId)}/power`,       { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ on }) }),
  setTemperature: (deviceId: string, temperature: number) => fetch(`${BASE}/airco/devices/${encodeURIComponent(deviceId)}/temperature`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ temperature }) }),
  setMode:        (deviceId: string, mode: string)      => fetch(`${BASE}/airco/devices/${encodeURIComponent(deviceId)}/mode`,        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) }),
  setFanSpeed:    (deviceId: string, speed: number)     => fetch(`${BASE}/airco/devices/${encodeURIComponent(deviceId)}/fanspeed`,    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ speed }) }),
}

export interface AircoDevice {
  deviceId: string
  name: string
  isOnline: boolean
  isOn: boolean
  currentTemperature: number
  targetTemperature: number
  mode: string   // cool | heat | fan | dry | auto
  fanSpeed: number
}

export interface DiskDriveInfo {
  name: string
  usedGb: number
  totalGb: number
  percent: number
}

export interface SystemStats {
  cpuLoad: number
  cpuTemp: number
  gpuLoad: number
  gpuTemp: number
  memoryPercent: number
  memoryUsedGb: number
  memoryTotalGb: number
  diskPercent: number
  networkDownBps: number
  networkUpBps: number
  disks: DiskDriveInfo[]
}

export interface HueScene {
  id: string
  name: string
}

// ── Washer ─────────────────────────────────────────────────────────────────────
export const washerApi = {
  getDevices: () => json<WasherDevice[]>(`${BASE}/washer/devices`),
}

export interface WasherDevice {
  deviceId: string
  name: string
  isOnline: boolean
  runState: string         // standby | running | pause | rinsing | spinning | end | error
  cycle: string            // Dutch display name
  remainingMinutes: number
}

export interface MediaInfo {
  title: string | null
  artist: string | null
  albumTitle: string | null
  albumArtDataUrl: string | null
  playbackStatus: string
  canPlay: boolean
  canPause: boolean
  canSkipNext: boolean
  canSkipPrev: boolean
}
