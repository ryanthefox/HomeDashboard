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

// ── Energie (Frank Energie) ───────────────────────────────────────────────────
export const energyApi = {
  getPrices: () => json<EnergyPrices>(`${BASE}/energy/prices`),
  getUsage:  () => json<EnergyUsage>(`${BASE}/energy/usage`),
}
export interface EnergyPrice {
  from: string; till: string
  total: number        // all-in €/unit incl. VAT and energy tax
  market: number; marketTax: number; markup: number; energyTax: number
}
export interface EnergyPrices { electricity: EnergyPrice[]; gas: EnergyPrice[] }
export interface EnergyUsagePoint {
  date: string; from: string | null
  electricityKwh: number; electricityCost: number
  gasM3: number; gasCost: number
  feedInKwh: number; feedInCost: number
}
export interface EnergyUsage {
  configured: boolean
  error: string | null
  lastMeterReadingDate: string | null
  month: { actualCosts: number; expectedCostsSoFar: number; expectedCosts: number; lastMeterReadingDate: string | null; gasExcluded: boolean } | null
  days: EnergyUsagePoint[]
  hours: EnergyUsagePoint[]
  hoursDate: string | null
}

// ── Ring ──────────────────────────────────────────────────────────────────────
export interface RingCamera {
  id: string; name: string
  isDoorbell: boolean; hasBattery: boolean; batteryLevel: number | null
  isOffline: boolean; hasLight: boolean; snapshotsBlocked: boolean
  lastEvent: { kind: string; at: string } | null
}
export interface RingStatus {
  connected: boolean; needsLogin: boolean; awaiting2fa: boolean
  error: string | null; bridgeDown?: boolean
  cameras: RingCamera[]
}
export interface RingEventItem { id: string; kind: string; createdAt: string; answered: boolean; recorded: boolean }
export interface RingEventPage { events: RingEventItem[]; next: string | null; error?: string }
export type RingEventKind = 'ding' | 'motion' | 'on_demand'
export interface RingLiveEvent { type: 'ding' | 'motion'; cameraId: string; cameraName: string; at: string }
export interface RingLoginResult { ok?: boolean; needs2fa?: boolean; prompt?: string; wrongCode?: boolean; error?: string }

async function ringJson<T>(input: string, init?: RequestInit): Promise<T> {
  // The bridge answers errors as JSON too (e.g. bridge down = 503); surface them as data
  const res = await apiFetch(input, init)
  return res.json() as Promise<T>
}
export const ringApi = {
  getStatus:   () => ringJson<RingStatus>(`${BASE}/ring/status`),
  getEvents:   (id: string, limit = 15, kind?: RingEventKind, page?: string | null) => {
    const q = new URLSearchParams({ limit: String(limit) })
    if (kind) q.set('kind', kind)
    if (page) q.set('page', page)
    return ringJson<RingEventPage>(`${BASE}/ring/events/${encodeURIComponent(id)}?${q}`)
  },
  liveStart: (id: string, sdp: string) =>
    ringJson<{ sessionId?: string; sdp?: string; error?: string }>(`${BASE}/ring/live/${encodeURIComponent(id)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sdp }) }),
  /** keepalive so it still reaches the server when the page is being closed */
  liveEnd: (sessionId: string) =>
    fetch(`${BASE}/ring/live-end/${encodeURIComponent(sessionId)}`, { method: 'POST', keepalive: true }).catch(() => {}),
  getRecording:(id: string, dingId: string) => ringJson<{ url?: string; error?: string }>(`${BASE}/ring/recording/${encodeURIComponent(id)}/${encodeURIComponent(dingId)}`),
  snapshotUrl: (id: string, t: number) => `${BASE}/ring/snapshot/${encodeURIComponent(id)}?t=${t}`,
  login: (body: { email: string; password: string; code?: string }) =>
    ringJson<RingLoginResult>(`${BASE}/ring/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  logout: () => ringJson<{ ok: boolean }>(`${BASE}/ring/logout`, { method: 'POST' }),
  test:   (type: 'ding' | 'motion') => ringJson<{ ok?: boolean; error?: string }>(`${BASE}/ring/test?type=${type}`, { method: 'POST' }),
}

// ── Agenda ────────────────────────────────────────────────────────────────────
export interface CalendarInfo { index: number; name: string; error: string | null }
export interface CalendarEvent { id: string; calendar: number; title: string; start: string; end: string; allDay: boolean; location: string | null }
export interface CalendarData { configured: boolean; calendars: CalendarInfo[]; events: CalendarEvent[] }
export const calendarApi = {
  get: (refresh = false) => json<CalendarData>(`${BASE}/calendar${refresh ? '?refresh=true' : ''}`),
}

// ── Server ────────────────────────────────────────────────────────────────────
export interface ContainerInfo { name: string; image: string; state: string; status: string; health: string | null; project: string | null; created: string }
export interface ServerStatus {
  hostname: string; os: string | null; kernel: string | null; uptimeSeconds: number; load: number[]; cpuCount: number
  docker: { available: boolean; error: string | null; version: string | null; running: number; stopped: number; containers: ContainerInfo[] }
}
export const serverApi = {
  getStatus: () => json<ServerStatus>(`${BASE}/server/status`),
}

// ── Reistijd ──────────────────────────────────────────────────────────────────
export type TravelDirection = 'work' | 'home'
export interface CarRoute { minutes: number; typicalMinutes: number; delayMinutes: number; km: number; via: string | null; updatedAt: string }
export interface TrainLeg { product: string; direction: string; from: string; to: string; departure: string; departureActual: string | null; arrival: string; arrivalActual: string | null; track: string | null; cancelled: boolean }
export interface TrainTrip { departure: string; departureActual: string | null; arrival: string; arrivalActual: string | null; minutes: number; transfers: number; delayMinutes: number; cancelled: boolean; status: string; crowd: string | null; legs: TrainLeg[] }
export interface TravelData {
  direction: TravelDirection; fromName: string; toName: string; carConfigured: boolean; trainConfigured: boolean
  car: CarRoute | null; carError: string | null; trains: TrainTrip[]; trainError: string | null
}
export interface StationRef { code: string; name: string }
export interface TravelSettings { homeStation: StationRef | null; workStation: StationRef | null; envHomeStation: string | null; envWorkStation: string | null; nsConfigured: boolean }
export const travelApi = {
  get: (dir: TravelDirection, refresh = false) => json<TravelData>(`${BASE}/travel?dir=${dir}${refresh ? '&refresh=true' : ''}`),
  getSettings: () => json<TravelSettings>(`${BASE}/travel/settings`),
  saveStations: (homeStation: StationRef | null, workStation: StationRef | null) =>
    json<TravelSettings>(`${BASE}/travel/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ homeStation, workStation }) }),
  searchStations: async (q: string) => {
    const res = await apiFetch(`${BASE}/travel/stations?q=${encodeURIComponent(q)}`)
    const body = await res.json()
    if (!res.ok) throw new Error(body?.error ?? 'Zoeken mislukt')
    return Array.isArray(body) ? body as StationRef[] : []
  },
}

// ── Spotify ───────────────────────────────────────────────────────────────────
export interface SpotifyStatus { configured: boolean; connected: boolean; redirectUri: string; user: string | null; product: string | null; error: string | null; canStream?: boolean }
export interface SpotifyDevice { id: string; name: string; type: string; isActive: boolean; volume: number | null; restricted: boolean; supportsVolume?: boolean }
export interface SpotifyTrack { id: string; uri: string; name: string; artists: string; album: string | null; image: string | null; durationMs: number }
export interface SpotifyPlayback { isPlaying: boolean; progressMs: number; track: SpotifyTrack | null; device: SpotifyDevice | null; shuffle: boolean; repeat: 'off' | 'track' | 'context'; contextUri: string | null; idle?: boolean }
export interface SpotifyItem { id: string; uri: string; kind: 'track' | 'artist' | 'album' | 'playlist'; name: string; subtitle: string | null; image: string | null }

/** Spotify calls answer errors as { error }; turn them into exceptions with that message. */
async function spotifyCall<T>(path: string, method: 'GET' | 'PUT' | 'POST' = 'GET', body?: unknown): Promise<T> {
  const res = await apiFetch(`${BASE}/spotify/${path}`, {
    method, headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Spotify: ${res.status}`)
  return data as T
}
export const spotifyApi = {
  status:    () => spotifyCall<SpotifyStatus>('status'),
  loginUrl:  () => spotifyCall<{ url: string; redirectUri: string }>('login'),
  token:     () => spotifyCall<{ accessToken: string; expiresIn: number }>('token'),
  sendCode:  (code: string) => spotifyCall<{ ok: boolean }>('code', 'POST', { code }),
  logout:    () => spotifyCall<{ ok: boolean }>('logout', 'POST'),
  player:    () => spotifyCall<SpotifyPlayback>('player'),
  devices:   () => spotifyCall<SpotifyDevice[]>('devices'),
  play:      (body: { deviceId?: string; contextUri?: string; uris?: string[]; offset?: number } = {}) => spotifyCall('play', 'PUT', body),
  pause:     () => spotifyCall('pause', 'PUT'),
  next:      () => spotifyCall('next', 'POST'),
  previous:  () => spotifyCall('previous', 'POST'),
  seek:      (ms: number) => spotifyCall(`seek?ms=${Math.round(ms)}`, 'PUT'),
  volume:    (pct: number) => spotifyCall(`volume?pct=${Math.round(pct)}`, 'PUT'),
  shuffle:   (on: boolean) => spotifyCall(`shuffle?on=${on}`, 'PUT'),
  repeat:    (mode: string) => spotifyCall(`repeat?mode=${mode}`, 'PUT'),
  transfer:  (deviceId: string, play = true) => spotifyCall('transfer', 'PUT', { deviceId, play }),
  playlists: () => spotifyCall<SpotifyItem[]>('playlists'),
  recent:    () => spotifyCall<SpotifyItem[]>('recent'),
  search:    (q: string) => spotifyCall<SpotifyItem[]>(`search?q=${encodeURIComponent(q)}`),
}
