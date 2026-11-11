import { useState, useEffect, useRef, memo, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Settings2, Sun, Moon, Home, CloudSun, Lightbulb, Music, Cpu, Wind, Trash2, Tv, Check, LogOut, Maximize, Minimize, Zap, BellRing,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HomeWidget } from './widgets/HomeWidget'
import { DoorbellAlert } from './widgets/ring/DoorbellAlert'

// Other tabs are code-split: e.g. Leaflet only loads when the weather tab opens
const WeatherWidget = lazy(() => import('./widgets/WeatherWidget').then(m => ({ default: m.WeatherWidget })))
const HueWidget     = lazy(() => import('./widgets/HueWidget').then(m => ({ default: m.HueWidget })))
const MusicWidget   = lazy(() => import('./widgets/MusicWidget').then(m => ({ default: m.MusicWidget })))
const SystemWidget  = lazy(() => import('./widgets/SystemWidget').then(m => ({ default: m.SystemWidget })))
const AircoWidget   = lazy(() => import('./widgets/AircoWidget').then(m => ({ default: m.AircoWidget })))
const AfvalWidget   = lazy(() => import('./widgets/AfvalWidget').then(m => ({ default: m.AfvalWidget })))
const PlexWidget    = lazy(() => import('./widgets/PlexWidget').then(m => ({ default: m.PlexWidget })))
const EnergyWidget  = lazy(() => import('./widgets/EnergyWidget').then(m => ({ default: m.EnergyWidget })))
const RingWidget    = lazy(() => import('./widgets/RingWidget').then(m => ({ default: m.RingWidget })))
import { useSignalR, useConnectionState } from '@/hooks/useSignalR'
import { useTheme } from '@/lib/ThemeContext'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useAuth, logout } from '@/hooks/useAuth'
import { spring, easeOutExpo } from '@/components/ui/motion'

type Tab = 'home' | 'weer' | 'verlichting' | 'muziek' | 'systeem' | 'airco' | 'energie' | 'deurbel' | 'afval' | 'plex'

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home',        label: 'Home',        icon: Home },
  { id: 'weer',        label: 'Weer',        icon: CloudSun },
  { id: 'verlichting', label: 'Verlichting', icon: Lightbulb },
  { id: 'muziek',      label: 'Muziek',      icon: Music },
  { id: 'systeem',     label: 'Systeem',     icon: Cpu },
  { id: 'airco',       label: 'Airco',       icon: Wind },
  { id: 'energie',     label: 'Energie',     icon: Zap },
  { id: 'deurbel',     label: 'Deurbel',     icon: BellRing },
  { id: 'afval',       label: 'Afval',       icon: Trash2 },
  { id: 'plex',        label: 'Plex',        icon: Tv },
]

// ── Ambient animated background ───────────────────────────────────────────────
export const AmbientBackground = memo(function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden>
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="blob b4" />
      <div className="grain" />
      <div className="vignette" />
    </div>
  )
})

// ── Clock with rolling digits (isolated so only it re-renders each second) ───
function RollingChar({ ch }: { ch: string }) {
  if (ch === ':') {
    return (
      <motion.span
        className="inline-block px-[0.04em] text-fg3"
        animate={{ opacity: [1, 0.35, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >:</motion.span>
    )
  }
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <span className="invisible">0</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={ch}
          className="absolute inset-0 text-center"
          initial={{ y: '90%', opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-90%', opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          {ch}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function greeting(h: number) {
  if (h < 6)  return 'Goedenacht'
  if (h < 12) return 'Goedemorgen'
  if (h < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    // Align ticks to the start of each second
    let id: ReturnType<typeof setTimeout>
    const tick = () => { setNow(new Date()); id = setTimeout(tick, 1000 - (Date.now() % 1000)) }
    id = setTimeout(tick, 1000 - (Date.now() % 1000))
    return () => clearTimeout(id)
  }, [])

  const time = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: easeOutExpo }}
      className="shrink-0"
    >
      <p className="hidden sm:block short:hidden label-caps mb-0.5">{greeting(now.getHours())}</p>
      <p className="whitespace-nowrap text-[28px] sm:text-[40px] short:text-[28px] font-semibold leading-none tracking-[-0.04em] text-fg tabular">
        {time.split('').map((ch, i) => <RollingChar key={i} ch={ch} />)}
      </p>
      <p className="mt-1 whitespace-nowrap text-xs capitalize text-fg3 hidden sm:block short:hidden">{date}</p>
    </motion.div>
  )
}

// ── Fullscreen toggle ─────────────────────────────────────────────────────────
// Safari (iPad) still only has the webkit-prefixed API; iPhone has none at all.
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> }
type FsElement  = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }

const fsDoc = document as FsDocument
const fsSupported = !!(document.documentElement.requestFullscreen || (document.documentElement as FsElement).webkitRequestFullscreen)
const isFullscreen = () => !!(fsDoc.fullscreenElement ?? fsDoc.webkitFullscreenElement)

function FullscreenButton() {
  const [active, setActive] = useState(isFullscreen)
  useEffect(() => {
    const update = () => setActive(isFullscreen())
    document.addEventListener('fullscreenchange', update)
    document.addEventListener('webkitfullscreenchange', update)
    return () => {
      document.removeEventListener('fullscreenchange', update)
      document.removeEventListener('webkitfullscreenchange', update)
    }
  }, [])

  if (!fsSupported) return null

  const toggle = () => {
    const el = document.documentElement as FsElement
    const p = isFullscreen()
      ? (fsDoc.exitFullscreen?.() ?? fsDoc.webkitExitFullscreen?.())
      : (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.())
    p?.catch(() => { /* refused by the browser */ })
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-card3 text-fg2 hover:text-fg transition-colors"
      title={active ? 'Volledig scherm sluiten' : 'Volledig scherm'}
      aria-label={active ? 'Volledig scherm sluiten' : 'Volledig scherm'}
    >
      {active ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
    </motion.button>
  )
}

// ── Connection indicator ──────────────────────────────────────────────────────
function ConnectionDot() {
  const { isConnected, state } = useConnectionState()
  const color = isConnected ? '#34d399' : state === 'Reconnecting' || state === 'Connecting' ? '#fbbf24' : '#f87171'
  const label = isConnected ? 'Live verbonden' : state === 'Reconnecting' ? 'Opnieuw verbinden…' : 'Geen verbinding'
  return (
    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-card3" title={label}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: color }} />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
      </span>
    </div>
  )
}

// ── Navigation ────────────────────────────────────────────────────────────────
function NavTabs({ active, onChange, mobile }: { active: Tab; onChange: (t: Tab) => void; mobile?: boolean }) {
  // On the scrollable (phone) bar, keep the active tab in view
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!mobile) return
    const el = navRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [active, mobile])

  return (
    <nav
      ref={navRef}
      className={cn(
        'panel relative flex gap-0.5 rounded-2xl p-1',
        mobile ? 'xl:hidden mt-3 short:mt-2 overflow-x-auto scrollbar-hide' : 'hidden xl:flex',
      )}
    >
      {TABS.map(tab => {
        const isActive = active === tab.id
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 short:py-1.5 text-sm font-medium transition-colors duration-200',
              mobile ? 'shrink-0 sm:flex-1 sm:justify-center sm:px-2' : '2xl:px-4',
              isActive ? 'text-zinc-950' : 'text-fg2 hover:text-fg',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={mobile ? 'nav-pill-m' : 'nav-pill'}
                transition={spring}
                className="absolute inset-0 rounded-xl bg-white"
                style={{ boxShadow: '0 6px 18px -6px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.8)' }}
              />
            )}
            <Icon className={cn('relative z-10 h-4 w-4', !mobile && 'hidden 2xl:block')} />
            <span className="relative z-10">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ── Page transition wrapper ───────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.99, filter: 'blur(6px)' },
  enter:   { opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)', transition: { duration: 0.5, ease: easeOutExpo } },
  exit:    { opacity: 0, y: -8, scale: 0.995, filter: 'blur(4px)', transition: { duration: 0.2, ease: 'easeIn' } },
} as const

export function Dashboard() {
  useSignalR()
  const { theme, toggle: toggleTheme } = useTheme()
  const { data: auth } = useAuth()
  const [storedTab, setActiveTab] = useLocalStorage<Tab>('active-tab', 'home')
  // Deep link: ?tab=weer opens that tab (handy for a wall-tablet bookmark)
  const [urlTab, setUrlTab] = useState<Tab | null>(() => {
    const t = new URLSearchParams(window.location.search).get('tab') as Tab | null
    return t && TABS.some(x => x.id === t) ? t : null
  })
  const activeTab = urlTab ?? storedTab
  const selectTab = (t: Tab) => { setUrlTab(null); setActiveTab(t) }
  const [editMode, setEditMode] = useState(false)

  // Exit edit mode when switching tabs
  useEffect(() => { if (activeTab !== 'home') setEditMode(false) }, [activeTab])

  return (
    <>
      <AmbientBackground />
      <DoorbellAlert />
      <div className="relative z-10 flex h-[100dvh] flex-col p-3 sm:p-5 short:p-3 overflow-hidden" style={{ colorScheme: theme }}>

        <header className="mb-3 sm:mb-5 short:mb-3 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <Clock />

            <NavTabs active={activeTab} onChange={selectTab} />

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: easeOutExpo }}
              className="flex items-center justify-end gap-2 sm:min-w-[180px]"
            >
              <AnimatePresence>
                {activeTab === 'home' && (
                  <motion.button
                    key="edit"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileTap={{ scale: 0.92 }}
                    transition={spring}
                    onClick={() => setEditMode(e => !e)}
                    className={cn(
                      'flex h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs font-semibold transition-colors',
                      editMode ? 'bg-accent' : 'bg-card3 text-fg2 hover:text-fg',
                    )}
                  >
                    {editMode ? <Check className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
                    <span className="hidden sm:inline">{editMode ? 'Klaar' : 'Bewerken'}</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <FullscreenButton />

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-card3 text-fg2 hover:text-fg transition-colors"
                title={theme === 'dark' ? 'Lichte modus' : 'Donkere modus'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={theme}
                    initial={{ y: 14, rotate: -90, opacity: 0 }}
                    animate={{ y: 0, rotate: 0, opacity: 1 }}
                    exit={{ y: -14, rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.3, ease: easeOutExpo }}
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              {auth?.required && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { void logout() }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-card3 text-fg2 hover:text-fg transition-colors"
                  title="Uitloggen"
                  aria-label="Uitloggen"
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              )}

              <ConnectionDot />
            </motion.div>
          </div>

          <NavTabs active={activeTab} onChange={selectTab} mobile />
        </header>

        <main className="relative flex-1 min-h-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="h-full w-full"
            >
              <Suspense fallback={null}>
              {activeTab === 'home'        && <HomeWidget editMode={editMode} />}
              {activeTab === 'weer'        && <WeatherWidget />}
              {activeTab === 'verlichting' && <HueWidget />}
              {activeTab === 'muziek'      && <MusicWidget />}
              {activeTab === 'systeem'     && <SystemWidget />}
              {activeTab === 'airco'       && <AircoWidget />}
              {activeTab === 'energie'     && <EnergyWidget />}
              {activeTab === 'deurbel'     && <RingWidget />}
              {activeTab === 'afval'       && <AfvalWidget />}
              {activeTab === 'plex'        && <PlexWidget />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  )
}
