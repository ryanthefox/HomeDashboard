import { useCallback, useEffect, useRef, useState } from 'react'
import { ringApi } from '@/lib/api'

export type LiveState = 'idle' | 'connecting' | 'live' | 'error'

/** How long a live view runs before it stops by itself (it keeps a battery doorbell awake). */
export const LIVE_SECONDS = 180

/** Ring's live view has no trickle ICE: wait until the browser has gathered its candidates. */
function iceGathered(pc: RTCPeerConnection, maxMs = 2500) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise<void>(resolve => {
    const done = () => { pc.removeEventListener('icegatheringstatechange', check); clearTimeout(t); resolve() }
    const check = () => { if (pc.iceGatheringState === 'complete') done() }
    const t = setTimeout(done, maxMs)
    pc.addEventListener('icegatheringstatechange', check)
  })
}

/**
 * Live view of a Ring camera over WebRTC. The dashboard only relays the offer/answer;
 * the video itself flows straight from Ring to this browser.
 */
export function useRingLive(cameraId: string | undefined) {
  const [state, setState] = useState<LiveState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [remaining, setRemaining] = useState(LIVE_SECONDS)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const sessionRef = useRef<string | null>(null)
  const runRef = useRef(0) // invalidates a start() that is still busy when stop() is called

  const stop = useCallback((nextState: LiveState = 'idle') => {
    runRef.current++
    pcRef.current?.close(); pcRef.current = null
    if (sessionRef.current) { void ringApi.liveEnd(sessionRef.current); sessionRef.current = null }
    setStream(null)
    setState(nextState)
  }, [])

  const start = useCallback(async () => {
    if (!cameraId) return
    stop('connecting')
    const run = runRef.current
    setError(null); setRemaining(LIVE_SECONDS)
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      pcRef.current = pc
      const media = new MediaStream()
      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.addTransceiver('audio', { direction: 'sendrecv' }) // what Ring expects; we never send a microphone track
      pc.ontrack = e => { media.addTrack(e.track); setStream(new MediaStream(media.getTracks())) }
      pc.onconnectionstatechange = () => {
        if (runRef.current !== run) return
        if (pc.connectionState === 'connected') setState('live')
        else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setError('Verbinding met de camera verbroken'); stop('error')
        }
      }

      await pc.setLocalDescription(await pc.createOffer())
      await iceGathered(pc)
      if (runRef.current !== run) return
      const res = await ringApi.liveStart(cameraId, pc.localDescription!.sdp)
      if (runRef.current !== run) { if (res.sessionId) void ringApi.liveEnd(res.sessionId); return }
      if (!res.sdp || !res.sessionId) throw new Error(res.error ?? 'Live beeld starten mislukt')
      sessionRef.current = res.sessionId
      await pc.setRemoteDescription({ type: 'answer', sdp: res.sdp })
    } catch (e) {
      if (runRef.current !== run) return
      setError(e instanceof Error ? e.message : 'Live beeld starten mislukt')
      stop('error')
    }
  }, [cameraId, stop])

  // Countdown → stops by itself
  const active = state === 'connecting' || state === 'live'
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setRemaining(r => r - 1), 1000)
    return () => clearInterval(t)
  }, [active])
  useEffect(() => { if (active && remaining <= 0) stop() }, [active, remaining, stop])

  // Stop when switching camera, leaving the tab, hiding the page or closing it
  useEffect(() => () => stop(), [cameraId, stop])
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') stop() }
    const onLeave = () => stop()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onLeave)
    return () => { document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', onLeave) }
  }, [stop])

  return { state, error, stream, remaining, start, stop: () => stop(), extend: () => setRemaining(LIVE_SECONDS) }
}
