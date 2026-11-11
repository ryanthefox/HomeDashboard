import * as signalR from '@microsoft/signalr'

export const connection = new signalR.HubConnectionBuilder()
  .withUrl('/hubs/dashboard')
  .withAutomaticReconnect({
    // Keep retrying forever (capped at 30s) — the backend may restart.
    nextRetryDelayInMilliseconds: ctx => Math.min(30_000, [0, 2000, 5000, 10000][ctx.previousRetryCount] ?? 30_000),
  })
  .configureLogging(signalR.LogLevel.Warning)
  .build()

// ── Connection state as an external store (for useSyncExternalStore) ─────────
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(l => l())

export function subscribeConnection(cb: () => void) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}
export const getConnectionState = () => connection.state

connection.onreconnecting(notify)
connection.onreconnected(async () => {
  // Groups are tied to the connection id, which changes on reconnect.
  try { await connection.invoke('SubscribeToAll') } catch (e) { console.warn('Resubscribe failed', e) }
  notify()
})
connection.onclose(() => {
  notify()
  scheduleStart(5_000)
})

let startTimer: ReturnType<typeof setTimeout> | null = null
let starting = false

function scheduleStart(delay: number) {
  if (startTimer) return
  startTimer = setTimeout(() => { startTimer = null; void startConnection() }, delay)
}

export async function startConnection() {
  if (starting || connection.state !== signalR.HubConnectionState.Disconnected) return
  starting = true
  notify()
  try {
    await connection.start()
    await connection.invoke('SubscribeToAll')
  } catch (e) {
    console.warn('SignalR start failed, retrying…', e)
    scheduleStart(5_000)
  } finally {
    starting = false
    notify()
  }
}
