import { useEffect, useState, type RefObject, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** True below the `sm` breakpoint (640px). */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

/** Observes an element's content-box size (rounded to whole px). */
export function useContainerSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width), h = Math.round(e.contentRect.height)
      setSize(prev => (prev.w === w && prev.h === h ? prev : { w, h }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

/** Uppercase tile header with icon and optional right-hand slot. */
export function TileHeader({ icon, title, right, className }: {
  icon: ReactNode; title: string; right?: ReactNode; className?: string
}) {
  return (
    <div className={cn('relative z-10 mb-3 flex shrink-0 items-center justify-between gap-2', className)}>
      <div className="flex items-center gap-2 label-caps">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-card3 text-fg2 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        {title}
      </div>
      {right}
    </div>
  )
}
