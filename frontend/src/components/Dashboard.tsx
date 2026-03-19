import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Settings, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WeatherWidget } from './widgets/WeatherWidget'
import { HueWidget } from './widgets/HueWidget'
import { MusicWidget } from './widgets/MusicWidget'
import { SystemWidget } from './widgets/SystemWidget'
import { HomeWidget } from './widgets/HomeWidget'
import { AircoWidget } from './widgets/AircoWidget'
import { useSignalR } from '@/hooks/useSignalR'
import { useTheme } from '@/lib/ThemeContext'

type Tab = 'home' | 'weer' | 'verlichting' | 'muziek' | 'systeem' | 'airco'

const TABS: { id: Tab; label: string }[] = [
  { id: 'home',        label: 'Home' },
  { id: 'weer',        label: 'Weer' },
  { id: 'verlichting', label: 'Verlichting' },
  { id: 'muziek',      label: 'Muziek' },
  { id: 'systeem',     label: 'Systeem' },
  { id: 'airco',       label: 'Airco' },
]

export function Dashboard() {
  const { isConnected } = useSignalR()
  const { theme, toggle: toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [editMode, setEditMode] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Exit edit mode when switching tabs
  useEffect(() => { if (activeTab !== 'home') setEditMode(false) }, [activeTab])

  const time = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex h-screen flex-col bg-surface p-5 overflow-hidden" style={{ colorScheme: theme }}>

      <header className="mb-5 flex items-center justify-between shrink-0">
        <div className="min-w-[180px]">
          <p className="text-3xl font-bold tracking-tight text-fg tabular-nums">{time}</p>
          <p className="mt-0.5 text-xs capitalize text-zinc-500">{date}</p>
        </div>

        <nav className="flex gap-1 rounded-2xl bg-card3 p-1 shadow-inner">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex min-w-[180px] items-center justify-end gap-3">
          {activeTab === 'home' && (
            <button
              onClick={() => setEditMode(e => !e)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all',
                editMode
                  ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                  : 'bg-card3 text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              {editMode ? 'Klaar' : 'Bewerken'}
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-card3 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={theme === 'dark' ? 'Lichte modus' : 'Donkere modus'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {isConnected
            ? <Wifi className="h-4 w-4 text-emerald-500" />
            : <WifiOff className="h-4 w-4 text-red-500" />
          }
        </div>
      </header>

      <main className="flex-1 min-h-0">
        {activeTab === 'home'        && <HomeWidget editMode={editMode} />}
        {activeTab === 'weer'        && <WeatherWidget />}
        {activeTab === 'verlichting' && <HueWidget />}
        {activeTab === 'muziek'      && <MusicWidget />}
        {activeTab === 'systeem'     && <SystemWidget />}
        {activeTab === 'airco'       && <AircoWidget />}
      </main>
    </div>
  )
}
