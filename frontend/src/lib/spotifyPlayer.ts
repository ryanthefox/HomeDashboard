import { useSyncExternalStore } from 'react'
import { spotifyApi } from './api'

/**
 * Makes this browser a Spotify Connect device (Spotify Web Playback SDK), so the
 * dashboard can play music on the screen/speakers it runs on. One player per page,
 * kept alive across tab switches.
 *
 * Spotify's limits: needs Premium, a secure page (https, or http://localhost) and a
 * desktop-class browser — phones/tablets are not supported by Spotify (use the app there).
 */

interface SdkPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  activateElement(): Promise<void>
  addListener(event: string, cb: (arg: { device_id?: string; message?: string }) => void): void
}
declare global {
  interface Window {
    Spotify?: { Player: new (opts: { name: string; getOAuthToken: (cb: (t: string) => void) => void; volume?: number }) => SdkPlayer }
    onSpotifyWebPlaybackSDKReady?: () => void
  }
}

export type BrowserPlayerStatus = 'idle' | 'loading' | 'ready' | 'unsupported' | 'error'
export interface BrowserPlayerState { status: BrowserPlayerStatus; deviceId: string | null; message: string | null }

let state: BrowserPlayerState = { status: 'idle', deviceId: null, message: null }
const listeners = new Set<() => void>()
const set = (s: Partial<BrowserPlayerState>) => { state = { ...state, ...s }; listeners.forEach(l => l()) }
let player: SdkPlayer | null = null
let onReadyHook: (() => void) | null = null

export const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Why this browser can't play by itself, or null when it (probably) can. */
export function browserPlaybackBlocker(): string | null {
  if (!window.isSecureContext) return 'insecure'
  if (isMobileDevice()) return 'mobile'
  if (!('requestMediaKeySystemAccess' in navigator)) return 'nodrm'
  return null
}

function deviceName() {
  const ua = navigator.userAgent
  const kind = /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux' : 'browser'
  return `HomeDashboard (${kind})`
}

function loadSdk(): Promise<void> {
  if (window.Spotify) return Promise.resolve()
  return new Promise((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve()
    const s = document.createElement('script')
    s.src = 'https://sdk.scdn.co/spotify-player.js'
    s.async = true
    s.onerror = () => reject(new Error('Spotify-speler kon niet laden'))
    document.head.appendChild(s)
  })
}

/** Starts the in-browser player once (safe to call often). `onReady` runs when the device is registered. */
export async function startBrowserPlayer(onReady?: () => void) {
  if (onReady) onReadyHook = onReady
  if (state.status !== 'idle') return
  const blocker = browserPlaybackBlocker()
  if (blocker) { set({ status: 'unsupported', message: blocker }); return }
  set({ status: 'loading', message: null })
  try {
    await loadSdk()
    const p = new window.Spotify!.Player({
      name: deviceName(),
      volume: 0.6,
      getOAuthToken: cb => { spotifyApi.token().then(t => cb(t.accessToken)).catch(() => set({ status: 'error', message: 'Geen toegang tot Spotify' })) },
    })
    p.addListener('ready', ({ device_id }) => { set({ status: 'ready', deviceId: device_id ?? null, message: null }); onReadyHook?.() })
    p.addListener('not_ready', () => set({ status: 'loading', deviceId: null }))
    p.addListener('initialization_error', () => set({ status: 'unsupported', message: 'nodrm' }))
    p.addListener('authentication_error', () => set({ status: 'error', message: 'Koppel Spotify opnieuw om op dit apparaat af te spelen' }))
    p.addListener('account_error', () => set({ status: 'error', message: 'Afspelen in de browser kan alleen met Spotify Premium' }))
    p.addListener('playback_error', ({ message }) => console.warn('Spotify playback error', message))
    player = p
    if (!(await p.connect())) set({ status: 'error', message: 'Verbinden met Spotify mislukt' })
  } catch (e) {
    set({ status: 'error', message: e instanceof Error ? e.message : 'Spotify-speler kon niet starten' })
  }
}

/** Must run inside a click/tap handler: unlocks audio playback (autoplay rules). */
export function activateBrowserPlayer() {
  void player?.activateElement().catch(() => {})
}

export function useBrowserPlayer(): BrowserPlayerState {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb) }, () => state)
}
