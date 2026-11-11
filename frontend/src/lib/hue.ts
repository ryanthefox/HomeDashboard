import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { hueApi, type HueRoom } from '@/lib/api'

const ROOMS_KEY = ['hue', 'rooms'] as const

// ── Colour helpers ────────────────────────────────────────────────────────────
/** Representative accent colour for a room (from its lit lamps). */
export function roomAccent(room: HueRoom, offColor = '#6b6b6b'): string {
  const on = room.lights.filter(l => l.isOn)
  if (on.length === 0) return offColor
  const c = on.find(l => l.colorHue != null && (l.colorSat ?? 0) > 50)
  if (c && c.colorHue != null && c.colorSat != null) {
    const h = Math.round((c.colorHue / 65535) * 360)
    const s = Math.round((c.colorSat / 254) * 90)
    return `hsl(${h},${s}%,60%)`
  }
  const ct = on.filter(l => l.colorTemp != null)
  if (ct.length > 0) {
    const avg = ct.reduce((s, l) => s + (l.colorTemp ?? 300), 0) / ct.length
    const t = (avg - 153) / (500 - 153) // 0 = cool, 1 = warm
    if (t < 0.3) return '#9cc8ff'
    if (t < 0.55) return '#ffd59a'
  }
  return '#ffb35c'
}

/** Lamps that are on; falls back to unreachable ones the bridge still reports as on. */
export function litLights(room: HueRoom) {
  const reachable = room.lights.filter(l => l.isOn && l.isReachable)
  return reachable.length > 0 ? reachable : room.lights.filter(l => l.isOn)
}

export function avgBrightnessPct(room: HueRoom): number {
  const on = litLights(room)
  if (on.length === 0) return 0
  return Math.round(on.reduce((s, l) => s + l.brightness, 0) / on.length / 254 * 100)
}

export const pctToBri = (pct: number) => Math.max(1, Math.round((pct / 100) * 254))

// ── Throttle: max one bridge call per key per `wait` ms, trailing call kept ──
// The Hue bridge handles ~10 commands/s; a dragged slider fires far more.
const throttles = new Map<string, { last: number; timer: ReturnType<typeof setTimeout> | null; fn: () => Promise<void> }>()

function throttled(key: string, fn: () => Promise<void>, onError: () => void, wait = 180) {
  const now = Date.now()
  const run = (entry: { last: number; timer: ReturnType<typeof setTimeout> | null; fn: () => Promise<void> }) => {
    entry.last = Date.now()
    entry.timer = null
    entry.fn().catch(onError)
  }
  const entry = throttles.get(key)
  if (!entry) {
    const e = { last: 0, timer: null, fn }
    throttles.set(key, e)
    run(e)
    return
  }
  entry.fn = fn
  if (entry.timer) return // trailing call already scheduled; it will use the latest fn
  const elapsed = now - entry.last
  if (elapsed >= wait) run(entry)
  else entry.timer = setTimeout(() => run(entry), wait - elapsed)
}

// ── Optimistic cache helpers ──────────────────────────────────────────────────
function patchRooms(qc: QueryClient, fn: (r: HueRoom) => HueRoom) {
  qc.setQueryData<HueRoom[]>(ROOMS_KEY, old => old?.map(fn) ?? old)
}

function recompute(r: HueRoom): HueRoom {
  const reachable = r.lights.filter(l => l.isReachable)
  const pool = reachable.length ? reachable : r.lights
  return { ...r, anyOn: pool.some(l => l.isOn), allOn: pool.length > 0 && pool.every(l => l.isOn) }
}

/** All Hue commands, with optimistic UI and bridge-friendly throttling. */
export function useHueActions() {
  const qc = useQueryClient()
  const resync = () => { void qc.invalidateQueries({ queryKey: ROOMS_KEY }) }

  return {
    toggleRoom(roomId: string, on: boolean) {
      patchRooms(qc, r => r.id === roomId
        ? { ...r, anyOn: on, allOn: on, lights: r.lights.map(l => ({ ...l, isOn: on })) }
        : r)
      hueApi.setGroupAction(roomId, { on }).catch(resync)
    },

    dimRoom(roomId: string, pct: number) {
      const bri = pctToBri(pct)
      patchRooms(qc, r => r.id === roomId
        ? { ...r, lights: r.lights.map(l => l.isOn ? { ...l, brightness: bri } : l) }
        : r)
      throttled(`room:${roomId}`, () => hueApi.setGroupAction(roomId, { brightness: bri }), resync)
    },

    toggleLight(lightId: string, on: boolean) {
      patchRooms(qc, r => r.lights.some(l => l.id === lightId)
        ? recompute({ ...r, lights: r.lights.map(l => l.id === lightId ? { ...l, isOn: on } : l) })
        : r)
      hueApi.setLightState(lightId, { on }).catch(resync)
    },

    dimLight(lightId: string, pct: number) {
      const bri = pctToBri(pct)
      patchRooms(qc, r => r.lights.some(l => l.id === lightId)
        ? { ...r, lights: r.lights.map(l => l.id === lightId ? { ...l, brightness: bri } : l) }
        : r)
      throttled(`light:${lightId}`, () => hueApi.setLightState(lightId, { brightness: bri }), resync)
    },

    activateScene(roomId: string, sceneId: string) {
      hueApi.activateScene(roomId, sceneId)
        .then(() => setTimeout(resync, 600))
        .catch(resync)
    },
  }
}
