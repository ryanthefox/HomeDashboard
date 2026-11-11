import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Lightbulb, Power, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hueApi, type HueRoom, type HueLight } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { roomAccent, lightColor, avgBrightnessPct, litLights, useHueActions } from '@/lib/hue'
import { Toggle, Panel, Press, spring, EmptyState, Skeleton } from '@/components/ui/motion'
import { BrightnessSlider } from '@/components/ui/BrightnessSlider'
import { SceneChips, BulbBadge, HUE_FAVORITE_KEY } from './home/MiniHue'

function LightRow({ light }: { light: HueLight }) {
  const { toggleLight, dimLight } = useHueActions()
  const accent = lightColor(light)
  return (
    <div className="py-2.5">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 shrink-0 rounded-full transition-all duration-500"
          style={{ background: light.isOn ? accent : 'var(--c-elev2)', boxShadow: light.isOn ? `0 0 10px ${accent}` : 'none' }} />
        <span className={cn('flex-1 truncate text-sm', light.isOn ? 'text-fg' : 'text-fg3', !light.isReachable && 'line-through opacity-60')}>
          {light.name}
        </span>
        <Toggle size="sm" on={light.isOn} accent={accent} disabled={!light.isReachable} onChange={v => toggleLight(light.id, v)} />
      </div>
      <AnimatePresence initial={false}>
        {light.isOn && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pl-5">
            <div className="pt-2">
              <BrightnessSlider compact value={Math.round((light.brightness / 254) * 100)} accent={accent} onChange={v => dimLight(light.id, v)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RoomCard({ room, expanded, onToggle, index, favorite, onFavorite }: {
  room: HueRoom; expanded: boolean; onToggle: () => void; index: number; favorite: boolean; onFavorite: () => void
}) {
  const { toggleRoom, dimRoom } = useHueActions()
  const accent  = roomAccent(room)
  const bri     = avgBrightnessPct(room)
  const onCount = litLights(room).length

  return (
    <Panel index={index} layout transition={spring} className="relative select-none overflow-hidden">
      {/* Coloured light wash that scales with brightness */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: room.anyOn ? 0.35 + bri / 250 : 0 }}
        transition={{ duration: 0.8 }}
        style={{ background: `radial-gradient(120% 90% at 0% 0%, ${accent}55 0%, ${accent}14 45%, transparent 75%)` }}
      />

      <div className="relative cursor-pointer px-5 pb-4 pt-5" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <BulbBadge on={room.anyOn} accent={accent} size={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-fg">{room.name}</p>
            <p className="text-xs text-fg3 tabular">
              {room.anyOn ? `${onCount} lamp${onCount !== 1 ? 'en' : ''} aan · ${bri}%` : `${room.lights.length} lampen · uit`}
            </p>
          </div>
          <button onClick={e => { e.stopPropagation(); onFavorite() }}
            title={favorite ? 'Favoriet verwijderen' : 'Als favoriet instellen'}
            className={cn('shrink-0 rounded-lg p-1.5 transition-colors', favorite ? 'text-amber-400' : 'text-fg3 hover:text-fg2')}>
            <Star className={cn('h-4 w-4', favorite && 'fill-current')} />
          </button>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={spring} className="text-fg3">
            <ChevronDown className="h-4 w-4" />
          </motion.span>
          <Toggle on={room.anyOn} accent={accent} onChange={v => toggleRoom(room.id, v)} />
        </div>

        <AnimatePresence initial={false}>
          {room.anyOn && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="pt-4"><BrightnessSlider value={bri} accent={accent} onChange={v => dimRoom(room.id, v)} /></div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {expanded && room.anyOn && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="pt-4"><SceneChips roomId={room.id} size="md" /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {expanded && room.lights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden border-t border-subtle"
          >
            <div className="divide-y divide-subtle px-5 pb-3">
              {room.lights.map(light => <LightRow key={light.id} light={light} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  )
}

export function HueWidget() {
  const { data: rooms, isLoading, isError } = useQuery<HueRoom[]>({
    queryKey: ['hue', 'rooms'], queryFn: hueApi.getRooms, staleTime: 10_000,
  })
  const [expanded, setExpanded] = useLocalStorage<Record<string, boolean>>('hue-expanded', {})
  const [favoriteId, setFavoriteId] = useLocalStorage<string>(HUE_FAVORITE_KEY, '')
  const { toggleRoom } = useHueActions()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 p-1 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
      </div>
    )
  }
  if (isError || !rooms || rooms.length === 0) {
    return (
      <div className="flex h-full">
        <EmptyState icon={<Lightbulb className="h-5 w-5" />}
          title={isError ? 'Bridge niet bereikbaar' : 'Geen lampen gevonden'}
          hint="Controleer HueBridge.BridgeIp en ApiKey in appsettings.json" />
      </div>
    )
  }

  const sorted = [...rooms].sort((a, b) => Number(b.id === favoriteId) - Number(a.id === favoriteId))
  const anyOn = rooms.some(r => r.anyOn)
  const litRooms = rooms.filter(r => r.anyOn).length

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      {/* Summary bar */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="mb-3 flex items-center justify-between px-1">
        <p className="text-sm text-fg2">
          <span className="font-semibold text-fg">{litRooms}</span> van {rooms.length} ruimtes aan
        </p>
        <Press
          onClick={() => rooms.filter(r => r.anyOn === anyOn).forEach(r => toggleRoom(r.id, !anyOn))}
          className={cn('flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold', anyOn ? 'bg-card3 text-fg2 hover:text-fg' : 'bg-accent')}
        >
          <Power className="h-3.5 w-3.5" />{anyOn ? 'Alles uit' : 'Alles aan'}
        </Press>
      </motion.div>

      <div className="grid grid-cols-1 items-start gap-3 p-1 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((room, i) => (
          <RoomCard key={room.id} room={room} index={i}
            favorite={room.id === favoriteId}
            onFavorite={() => setFavoriteId(id => id === room.id ? '' : room.id)}
            expanded={!!expanded[room.id]}
            onToggle={() => setExpanded(e => ({ ...e, [room.id]: !e[room.id] }))} />
        ))}
      </div>
    </div>
  )
}
