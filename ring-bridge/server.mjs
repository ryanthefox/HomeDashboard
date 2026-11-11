// Ring bridge: keeps a ring-client-api session alive and offers the dashboard a
// tiny local HTTP API. Listens on 127.0.0.1 only — the dashboard backend proxies it.
//
//   GET  /status                 login state + cameras
//   POST /login                  { email, password, code? }  → { ok } | { needs2fa, prompt }
//   POST /logout
//   GET  /snapshot/:id           latest snapshot (image/jpeg)
//   GET  /events/:id?limit=10    recent dings / motion
//   GET  /recording/:id/:dingId  { url } of a recorded clip (needs Ring Protect)
//   GET  /stream                 Server-Sent Events: ding / motion as they happen
//   POST /test                   { type } — sends a fake event, to try the popup

import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { RingApi } from 'ring-client-api'
import { RingRestClient } from 'ring-client-api/rest-client'

const DATA = process.env.RING_DATA || './data'
const PORT = Number(process.env.RING_PORT || 5057)
const BIND = process.env.RING_BIND || '127.0.0.1'
const TOKEN_FILE = path.join(DATA, 'ring.json')
const SNAPSHOT_MAX_AGE_MS = 60_000

let api = null          // RingApi once logged in
let cameras = []        // RingCamera[]
let lastError = null
let pendingLogin = null // { email, password, client } while waiting for a 2FA code
const snapshots = new Map() // cameraId -> { at, buf, pending }
const lastEvent = new Map() // cameraId -> { kind, at }
const listeners = new Set() // SSE responses

const log = (...a) => console.log(new Date().toISOString(), '[ring]', ...a)

// ── Token storage ─────────────────────────────────────────────────────────────
async function loadToken() {
  try { return JSON.parse(await fs.readFile(TOKEN_FILE, 'utf8')).refreshToken || null }
  catch { return null }
}
async function saveToken(refreshToken) {
  await fs.mkdir(DATA, { recursive: true })
  await fs.writeFile(TOKEN_FILE, JSON.stringify({ refreshToken, savedAt: new Date().toISOString() }), { mode: 0o600 })
}

// ── Session ───────────────────────────────────────────────────────────────────
async function connect(refreshToken) {
  disconnect()
  api = new RingApi({
    refreshToken,
    controlCenterDisplayName: 'HomeDashboard',
    avoidSnapshotBatteryDrain: true,   // battery doorbells: don't wake them for snapshots
    cameraStatusPollingSeconds: 30,
  })
  // Ring rotates the token; it also carries the push-notification credentials
  api.onRefreshTokenUpdated.subscribe(({ newRefreshToken }) => {
    saveToken(newRefreshToken).catch(e => log('could not save token', e.message))
  })

  cameras = await api.getCameras()
  lastError = null
  log(`connected, ${cameras.length} camera(s): ${cameras.map(c => c.name).join(', ')}`)

  for (const cam of cameras) {
    cam.onDoorbellPressed.subscribe(() => emit(cam, 'ding'))
    cam.onMotionDetected.subscribe(motion => { if (motion) emit(cam, 'motion') })
  }
}

function disconnect() {
  try { api?.disconnect() } catch { /* ignore */ }
  api = null
  cameras = []
}

function emit(cam, kind) {
  const at = new Date().toISOString()
  lastEvent.set(String(cam.id), { kind, at })
  snapshots.delete(String(cam.id)) // next request fetches a fresh image
  log('event', kind, cam.name)
  const msg = `data: ${JSON.stringify({ type: kind, cameraId: String(cam.id), cameraName: cam.name, at })}\n\n`
  for (const res of listeners) res.write(msg)
}

async function start() {
  const token = await loadToken()
  if (!token) { log('not logged in yet — log in from the dashboard'); return }
  try { await connect(token) }
  catch (e) { lastError = `Verbinden met Ring mislukt: ${e.message}`; log(lastError); disconnect() }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const camById = id => cameras.find(c => String(c.id) === String(id))

function cameraInfo(c) {
  const ev = lastEvent.get(String(c.id))
  return {
    id: String(c.id),
    name: c.name,
    isDoorbell: c.isDoorbot,
    hasBattery: c.hasBattery,
    batteryLevel: c.batteryLevel,
    isOffline: c.isOffline,
    hasLight: c.hasLight,
    snapshotsBlocked: c.snapshotsAreBlocked,
    lastEvent: ev ?? null,
  }
}

async function snapshot(cam) {
  const key = String(cam.id)
  const cur = snapshots.get(key)
  if (cur?.buf && Date.now() - cur.at < SNAPSHOT_MAX_AGE_MS) return cur.buf
  if (cur?.pending) return cur.pending
  const pending = cam.getSnapshot()
    .then(buf => { snapshots.set(key, { at: Date.now(), buf }); return buf })
    .catch(e => {
      snapshots.set(key, { ...cur, pending: null })
      if (cur?.buf) return cur.buf // keep showing the last good image
      throw e
    })
  snapshots.set(key, { ...cur, pending })
  return pending
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' })
  res.end(type === 'application/json' ? JSON.stringify(body) : body)
}

async function readJson(req) {
  let raw = ''
  for await (const chunk of req) { raw += chunk; if (raw.length > 10_000) throw new Error('too large') }
  return raw ? JSON.parse(raw) : {}
}

// ── Login (email + password, then the 2FA code Ring sends) ───────────────────
async function login({ email, password, code }) {
  if (!email || !password) return { status: 400, body: { error: 'E-mail en wachtwoord zijn verplicht' } }

  let client
  if (code && pendingLogin && pendingLogin.email === email) client = pendingLogin.client
  else { client = new RingRestClient({ email, password, controlCenterDisplayName: 'HomeDashboard' }); pendingLogin = null }

  try {
    const auth = code ? await client.getAuth(String(code).trim()) : await client.getCurrentAuth()
    pendingLogin = null
    await saveToken(auth.refresh_token)
    await connect(auth.refresh_token)
    return { status: 200, body: { ok: true } }
  } catch (e) {
    if (client.promptFor2fa) {
      pendingLogin = { email, password, client }
      return { status: 200, body: { needs2fa: true, prompt: client.promptFor2fa, wrongCode: !!code } }
    }
    pendingLogin = null
    log('login failed', e.message)
    return { status: 400, body: { error: 'Inloggen bij Ring mislukt: controleer je e-mail en wachtwoord' } }
  }
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const parts = url.pathname.split('/').filter(Boolean)
  try {
    if (req.method === 'GET' && url.pathname === '/status') {
      return send(res, 200, {
        connected: !!api,
        needsLogin: !api,
        awaiting2fa: !!pendingLogin,
        error: lastError,
        cameras: cameras.map(cameraInfo),
      })
    }

    if (req.method === 'POST' && url.pathname === '/login') {
      const r = await login(await readJson(req))
      return send(res, r.status, r.body)
    }

    if (req.method === 'POST' && url.pathname === '/logout') {
      disconnect(); pendingLogin = null; snapshots.clear()
      await fs.rm(TOKEN_FILE, { force: true })
      return send(res, 200, { ok: true })
    }

    if (req.method === 'GET' && parts[0] === 'snapshot' && parts[1]) {
      const cam = camById(parts[1])
      if (!cam) return send(res, 404, { error: 'Onbekende camera' })
      const buf = await snapshot(cam)
      return send(res, 200, buf, 'image/jpeg')
    }

    if (req.method === 'GET' && parts[0] === 'events' && parts[1]) {
      const cam = camById(parts[1])
      if (!cam) return send(res, 404, { error: 'Onbekende camera' })
      const limit = Math.min(50, Number(url.searchParams.get('limit')) || 10)
      const { events } = await cam.getEvents({ limit })
      return send(res, 200, events.map(e => ({
        id: e.ding_id_str,
        kind: e.kind,                 // 'ding' | 'motion' | 'on_demand' | ...
        createdAt: e.created_at,
        answered: e.state === 'completed' && e.kind === 'ding',
        recorded: e.recording_status === 'ready',
      })))
    }

    if (req.method === 'GET' && parts[0] === 'recording' && parts[1] && parts[2]) {
      const cam = camById(parts[1])
      if (!cam) return send(res, 404, { error: 'Onbekende camera' })
      const recUrl = await cam.getRecordingUrl(parts[2], { transcoded: false })
      return send(res, 200, { url: recUrl })
    }

    if (req.method === 'POST' && url.pathname === '/test') {
      const { type } = await readJson(req)
      const cam = cameras[0] ?? { id: 'test', name: 'Testmelding' }
      emit(cam, type === 'motion' ? 'motion' : 'ding')
      return send(res, 200, { ok: true })
    }

    if (req.method === 'GET' && url.pathname === '/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' })
      res.write(': connected\n\n')
      listeners.add(res)
      const ping = setInterval(() => res.write(': ping\n\n'), 25_000)
      req.on('close', () => { clearInterval(ping); listeners.delete(res) })
      return
    }

    send(res, 404, { error: 'Not found' })
  } catch (e) {
    log('error', req.method, url.pathname, e.message)
    send(res, 502, { error: e.message })
  }
})

server.listen(PORT, BIND, () => log(`listening on http://${BIND}:${PORT}`))
void start()

process.on('SIGTERM', () => { disconnect(); process.exit(0) })
process.on('unhandledRejection', e => log('unhandled', e?.message ?? e))
