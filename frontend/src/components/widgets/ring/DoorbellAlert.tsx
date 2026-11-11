import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BellRing, Footprints, X } from 'lucide-react'
import { ringApi, type RingLiveEvent } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { onRingEvent, RING_MOTION_ALERT_KEY } from '@/lib/ring'

const DING_VISIBLE_MS   = 90_000
const MOTION_VISIBLE_MS = 8_000

/** Two-tone "ding-dong" via Web Audio (no sound file needed). Browsers only allow it after a first tap on the page. */
function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const tone = (freq: number, start: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, ctx.currentTime + start)
      g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 1.1)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + 1.2)
    }
    tone(784, 0); tone(622, 0.45)
    setTimeout(() => void ctx.close(), 2000)
  } catch { /* audio not available */ }
}

export function DoorbellAlert() {
  const [ding, setDing] = useState<(RingLiveEvent & { t: number }) | null>(null)
  const [motionEv, setMotionEv] = useState<(RingLiveEvent & { t: number }) | null>(null)
  const [motionAlerts] = useLocalStorage<boolean>(RING_MOTION_ALERT_KEY, true)
  const motionRef = useRef(motionAlerts)
  motionRef.current = motionAlerts

  useEffect(() => onRingEvent(e => {
    const t = Date.now()
    if (e.type === 'ding') { setDing({ ...e, t }); playChime() }
    else if (e.type === 'motion' && motionRef.current) setMotionEv({ ...e, t })
  }), [])

  useEffect(() => {
    if (!ding) return
    const id = setTimeout(() => setDing(null), DING_VISIBLE_MS)
    return () => clearTimeout(id)
  }, [ding])
  useEffect(() => {
    if (!motionEv) return
    const id = setTimeout(() => setMotionEv(null), MOTION_VISIBLE_MS)
    return () => clearTimeout(id)
  }, [motionEv])

  return createPortal(
    <>
      <AnimatePresence>
        {ding && (
          <motion.div
            key="ding"
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onPointerDown={e => { if (e.target === e.currentTarget) setDing(null) }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="panel w-full max-w-xl overflow-hidden rounded-3xl bg-[var(--c-solid)]"
            >
              <div className="relative aspect-video bg-black">
                <img key={ding.t} src={ringApi.snapshotUrl(ding.cameraId, ding.t)} alt="" className="h-full w-full object-cover"
                  onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                <button onClick={() => setDing(null)} aria-label="Sluiten"
                  className="absolute right-3 top-3 rounded-xl bg-black/55 p-2 text-white backdrop-blur-md hover:bg-black/70">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-4 p-5">
                <motion.span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-400/15 text-orange-300"
                  animate={{ rotate: [0, -14, 12, -8, 6, 0] }} transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 1.4 }}
                >
                  <BellRing className="h-6 w-6" />
                </motion.span>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-semibold tracking-tight text-fg">Er wordt aangebeld</p>
                  <p className="text-sm text-fg3">
                    {ding.cameraName} · {new Date(ding.at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => setDing(null)} className="rounded-xl bg-card3 px-4 py-2 text-sm font-medium text-fg2 hover:text-fg">Sluiten</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {motionEv && !ding && (
          <motion.div
            key="motion"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="panel fixed bottom-4 left-1/2 z-[105] flex w-[min(92vw,360px)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-[var(--c-solid)] p-2.5 pr-3"
          >
            <img key={motionEv.t} src={ringApi.snapshotUrl(motionEv.cameraId, motionEv.t)} alt="" className="h-12 w-20 shrink-0 rounded-xl bg-black object-cover"
              onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-fg"><Footprints className="h-3.5 w-3.5 text-fg3" />Beweging</p>
              <p className="truncate text-xs text-fg3">{motionEv.cameraName}</p>
            </div>
            <button onClick={() => setMotionEv(null)} aria-label="Sluiten" className="rounded-lg p-1.5 text-fg3 hover:text-fg"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  )
}
