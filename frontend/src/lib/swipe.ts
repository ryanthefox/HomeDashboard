import { useEffect, useRef, type RefObject } from 'react'

/**
 * Horizontal swipe between pages (home screens / tabs), like a phone's home screen.
 * - Touch/pen: follow the finger, commit when it travelled far or fast enough.
 * - Trackpad: a horizontal two-finger swipe (wheel deltaX) also flips the page.
 * Gestures that start on something that handles horizontal movement itself
 * (sliders, inputs, horizontally scrolling lists, charts, [data-no-swipe]) are ignored.
 */
export interface SwipeOptions {
  enabled: boolean
  /** Is there a page in that direction? (1 = next/left swipe, -1 = previous/right swipe) */
  canGo: (dir: 1 | -1) => boolean
  onSwipe: (dir: 1 | -1) => void
  /** Live finger offset in px while dragging (0 when released/cancelled). */
  onDrag?: (dx: number) => void
}

const INTERACTIVE = 'input, textarea, select, [role="slider"], [data-no-swipe], [contenteditable="true"]'

/** True when the gesture started inside an element that scrolls or acts horizontally. */
function handlesHorizontal(target: EventTarget | null, root: HTMLElement): boolean {
  let el = target instanceof Element ? target : null
  if (el?.closest(INTERACTIVE)) return true
  while (el && el !== root) {
    if (el instanceof HTMLElement && el.scrollWidth > el.clientWidth + 2) {
      const ox = getComputedStyle(el).overflowX
      if (ox === 'auto' || ox === 'scroll') return true
    }
    el = el.parentElement
  }
  return false
}

export function useSwipeNavigation(ref: RefObject<HTMLElement | null>, opts: SwipeOptions) {
  const o = useRef(opts)
  o.current = opts

  useEffect(() => {
    const root = ref.current
    if (!root) return

    // ── Touch / pen ──────────────────────────────────────────────────────────
    let start: { id: number; x: number; y: number; t: number } | null = null
    let axis: 'x' | 'y' | null = null
    let dx = 0

    const reset = () => { start = null; axis = null; if (dx !== 0) { dx = 0; o.current.onDrag?.(0) } }

    const down = (e: PointerEvent) => {
      if (!o.current.enabled || e.pointerType === 'mouse' || !e.isPrimary) return
      if (handlesHorizontal(e.target, root)) return
      start = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }
      axis = null; dx = 0
    }
    const move = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      const mx = e.clientX - start.x, my = e.clientY - start.y
      if (!axis) {
        if (Math.abs(mx) < 10 && Math.abs(my) < 10) return
        axis = Math.abs(mx) > Math.abs(my) * 1.2 ? 'x' : 'y'
        if (axis === 'y') { start = null; return } // vertical scroll: leave it to the browser
      }
      const dir: 1 | -1 = mx < 0 ? 1 : -1
      dx = o.current.canGo(dir) ? mx : mx * 0.25 // rubber band at the ends
      o.current.onDrag?.(dx)
    }
    const up = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      if (axis === 'x') {
        const dt = Math.max(1, performance.now() - start.t)
        const mx = e.clientX - start.x
        const dir: 1 | -1 = mx < 0 ? 1 : -1
        const far = Math.abs(mx) > root.clientWidth * 0.22
        const fast = Math.abs(mx) > 40 && Math.abs(mx) / dt > 0.45
        if ((far || fast) && o.current.canGo(dir)) o.current.onSwipe(dir)
      }
      reset()
    }
    const cancel = () => reset()

    // ── Trackpad (horizontal wheel) ──────────────────────────────────────────
    let acc = 0, lastWheel = 0, cooldownUntil = 0
    const wheel = (e: WheelEvent) => {
      if (!o.current.enabled || e.ctrlKey) return
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.5) return
      if (handlesHorizontal(e.target, root)) return
      const now = performance.now()
      if (now < cooldownUntil) return
      if (now - lastWheel > 250) acc = 0
      lastWheel = now
      acc += e.deltaX
      if (Math.abs(acc) > 110) {
        const dir: 1 | -1 = acc > 0 ? 1 : -1
        acc = 0
        cooldownUntil = now + 800 // one flip per gesture (trackpads keep sending momentum)
        if (o.current.canGo(dir)) o.current.onSwipe(dir)
      }
    }

    root.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    root.addEventListener('wheel', wheel, { passive: true })
    return () => {
      root.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
      root.removeEventListener('wheel', wheel)
    }
  }, [ref])
}
