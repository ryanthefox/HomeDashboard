import { UnauthorizedError, notifyAuthRequired } from './auth'

const BASE = '/api'

/** fetch that turns a 401 (not / no longer logged in) into the login screen. */
async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (res.status === 401) {
    notifyAuthRequired()
    throw new UnauthorizedError()
  }
  return res
}

async function json<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await apiFetch(input, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

/** Fire a command; throws on non-2xx so mutations can roll back optimistic updates. */
async function send(url: string, method: 'POST' | 'PUT', body?: unknown): Promise<void> {
  const res = await apiFetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
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
    send(`${BASE}/hue/lights/${id}/state`, 'PUT', state),
  setGroupAction: (groupId: string, action: { on?: boolean; brightness?: number }) =>
    send(`${BASE}/hue/groups/${groupId}/action`, 'PUT', action),
  getScenes: (groupId: string) => json<HueScene[]>(`${BASE}/hue/groups/${groupId}/scenes`),
  activateScene: (groupId: string, sceneId: string) =>
    send(`${BASE}/hue/groups/${groupId}/scene/${sceneId}`, 'PUT'),
}

// ── Music ─────────────────────────────────────────────────────────────────────
export const musicApi = {
  getCurrent: () => json<MediaInfo>(`${BASE}/music`),
  play:  () => send(`${BASE}/music/play`,  'POST'),
  pause: () => send(`${BASE}/music/pause`, 'POST'),
  next:  () => send(`${BASE}/music/next`,  'POST'),
  prev:  () => send(`${BASE}/music/prev`,  'POST'),
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

// ── PC (agent + Wake-on-LAN) ─────────────────────────────────────────────────
export type PcState = 'online' | 'offline' | 'waking' | 'stopping'
export interface PcStatus {
  configured: boolean
  hasAgent: boolean
  canWake: boolean
  state: PcState
  name: string
  hostname: string | null
  uptimeSeconds: number | null
}
export type PcPowerCommand = 'shutdown' | 'sleep' | 'restart'

export const pcApi = {
  getStatus: () => json<PcStatus>(`${BASE}/pc/status`),
  getStats:  async (): Promise<SystemStats | null> => {
    const res = await apiFetch(`${BASE}/pc/stats`)
    if (res.status === 204) return null
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json() as Promise<SystemStats>
  },
  wake:  () => send(`${BASE}/pc/wake`, 'POST'),
  power: (command: PcPowerCommand) => send(`${BASE}/pc/power/${command}`, 'POST'),
}

// ── Audio ──────────────────────────────────────────────────────────────────────
export const audioApi = {
  getOutputs: () => json<AudioOutputDevice[]>(`${BASE}/audio/outputs`),
  setDefault: (deviceId: string) =>
    send(`${BASE}/audio/outputs/default`, 'POST', { deviceId }),
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
  setPower:       (deviceId: string, on: boolean)         => send(`${BASE}/airco/devices/${encodeURIComponent(deviceId)}/power`,       'PUT', { on }),
  setTemperature: (deviceId: string, temperature: number) => send(`${BASE}/airco/devices/${encodeURIComponent(deviceId)}/temperature`, 'PUT', { temperature }),
  setMode:        (deviceId: string, mode: string)        => send(`${BASE}/airco/devices/${encodeURIComponent(deviceId)}/mode`,        'PUT', { mode }),
  setFanSpeed:    (deviceId: string, speed: number)       => send(`${BASE}/airco/devices/${encodeURIComponent(deviceId)}/fanspeed`,    'PUT', { speed }),
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

// ── Afval ─────────────────────────────────────────────────────────────────────
export const afvalApi = {
  getUpcoming: () => json<AfvalItem[]>(`${BASE}/afval/upcoming`),
  getAll:      () => json<AfvalItem[]>(`${BASE}/afval/all`),
}
export interface AfvalItem {
  type: string
  date: string  // ISO date
  label: string
}

// ── Plex ──────────────────────────────────────────────────────────────────────
export const plexApi = {
  getOnDeck:   () => json<PlexItem[]>(`${BASE}/plex/ondeck`),
  getRecent:   () => json<PlexItem[]>(`${BASE}/plex/recent`),
  getSessions: () => json<PlexSession[]>(`${BASE}/plex/sessions`),
  getStats:    async (): Promise<PlexStats | null> => {
    const res = await apiFetch(`${BASE}/plex/stats`)
    if (res.status === 204) return null
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json() as Promise<PlexStats>
  },
}
export interface PlexStats {
  machineId: string | null
  serverName: string | null
  movies: number
  shows: number
  episodes: number
  addedThisWeek: number
}
export interface PlexItem {
  key: string
  title: string
  type: string
  thumbUrl: string | null
  year: number | null
  showTitle: string | null
  season: number | null
  episode: number | null
  summary: string | null
  viewOffset: number  // ms
  duration: number    // ms
  addedAt: number     // unix seconds
}
export interface PlexSession {
  key: string
  sessionId: string
  title: string
  type: string
  thumbUrl: string | null
  showTitle: string | null
  season: number | null
  episode: number | null
  user: string | null
  playerName: string | null
  platform: string | null
  state: string
  viewOffset: number
  duration: number
  decision: 'directplay' | 'directstream' | 'transcode'
  quality: string | null
  local: boolean
  bandwidth: number | null  // kbps
}
