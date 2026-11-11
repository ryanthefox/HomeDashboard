import { createContext, useContext, useEffect, useState, type RefObject, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Live result of a CSS media query. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    setMatches(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

/** True below the `sm` breakpoint (640px). */
export const useIsMobile = () => useMediaQuery('(max-width: 639px)')

/**
 * Number of columns for the scrollable home layout, or 0 when the screen is big
 * enough for the fixed three-column desktop layout. Portrait tablets and
 * landscape phones get the scrollable layout so tiles never get squashed.
 */
export function useCompactColumns(): 0 | 1 | 2 | 3 {
  const compact = useMediaQuery('(max-width: 1023px), (max-height: 559px)')
  const sm = useMediaQuery('(min-width: 640px)')
  const lg = useMediaQuery('(min-width: 1024px)')
  if (!compact) return 0
  return lg ? 3 : sm ? 2 : 1
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

/** Dashboard tab a home tile belongs to (null in edit mode or outside the home grid). */
export const TileTabContext = createContext<string | null>(null)
export const NAVIGATE_EVENT = 'dashboard:navigate'
/** Opens a dashboard tab (handled in Dashboard.tsx). */
export const goToTab = (tab: string) => window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: tab }))
export const useTileTab = () => useContext(TileTabContext)

/** Tile title that opens the tile's own tab when clicked. */
export function TileTitle({ children, className }: { children: ReactNode; className?: string }) {
  const tab = useTileTab()
  if (!tab) return <span className={cn('min-w-0 truncate', className)}>{children}</span>
  return (
    <button onClick={() => goToTab(tab)} title="Openen"
      className={cn('group/title flex min-w-0 items-center gap-0.5 uppercase transition-colors hover:text-fg', className)}>
      <span className="truncate">{children}</span>
      <ChevronRight className="h-3 w-3 shrink-0 -translate-x-1 opacity-0 transition-all group-hover/title:translate-x-0 group-hover/title:opacity-100" />
    </button>
  )
}

/** Uppercase tile header with icon and optional right-hand slot. */
export function TileHeader({ icon, title, right, className }: {
  icon: ReactNode; title: string; right?: ReactNode; className?: string
}) {
  return (
    <div className={cn('relative z-10 mb-3 flex shrink-0 items-center justify-between gap-2', className)}>
      <div className="flex min-w-0 items-center gap-2 label-caps">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-card3 text-fg2 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        <TileTitle>{title}</TileTitle>
      </div>
      {right && <div className="flex shrink-0 items-center">{right}</div>}
    </div>
  )
}
