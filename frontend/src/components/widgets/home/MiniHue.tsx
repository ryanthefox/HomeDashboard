import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Lightbulb, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hueApi, type HueRoom, type HueScene } from '@/lib/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { roomAccent, avgBrightnessPct, litLights, useHueActions } from '@/lib/hue'
import { Toggle, spring, EmptyState } from '@/components/ui/motion'
import { BrightnessSlider } from '@/components/ui/BrightnessSlider'
import { useContainerSize } from './shared'
import { HUE_VISIBLE_KEY, pickVisible } from './TileConfig'

export function SceneChips({ roomId, size = 'sm' }: { roomId: string; size?: 'sm' | 'md' }) {
  const { data: scenes } = useQuery<HueScene[]>({
    queryKey: ['hue', 'scenes', roomId],
    queryFn: () => hueApi.getScenes(roomId),
    staleTime: 5 * 60_000,
  })
  const { activateScene } = useHueActions()
  const [last, setLast] = useState<string | null>(null)
  if (!scenes || scenes.length === 0) return null
  return (
    <div className="flex shrink-0 flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
      {scenes.map((s, i) => (
        <motion.button
          key={s.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.025 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => { setLast(s.id); activateScene(roomId, s.id) }}
          className={cn(
            'rounded-full border font-medium transition-colors',
            size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
            last === s.id
              ? 'border-transparent bg-white text-zinc-950'
              : 'border-subtle2 bg-card3 text-fg2 hover:text-fg',
          )}
        >
          {s.name}
        </motion.button>
      ))}
    </div>
  )
}

/** Glowing bulb badge tinted with the room's light colour. */
export function BulbBadge({ on, accent, size = 40 }: { on: boolean; accent: string; size?: number }) {
  return (
    <motion.div
      className="relative flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: size, height: size }}
      animate={{
        backgroundColor: on ? `${accent}26` : 'rgba(127,127,127,0.10)',
        boxShadow: on ? `0 0 28px -4px ${accent}99, inset 0 0 0 1px ${accent}40` : '0 0 0 0 transparent, inset 0 0 0 1px rgba(127,127,127,.12)',
      }}
      transition={{ duration: 0.5 }}
    >
      <Lightbulb className="h-1/2 w-1/2 transition-colors duration-500" style={{ color: on ? accent : 'var(--c-fg3)', fill: on ? `${accent}55` : 'transparent' }} />
    </motion.div>
  )
}

export const HUE_FAVORITE_KEY = 'hue-favorite-room'
const FAVORITE_REVERT_MS = 2 * 60_000

export function MiniHue() {
  const ref = useRef<HTMLDivElement>(null)
  const { h } = useContainerSize(ref)
  const { data: rooms } = useQuery<HueRoom[]>({ queryKey: ['hue', 'rooms'], queryFn: hueApi.getRooms, staleTime: 10_000 })
  const [favoriteId, setFavoriteId] = useLocalStorage<string>(HUE_FAVORITE_KEY, '')
  const [visibleIds] = useLocalStorage<string[]>(HUE_VISIBLE_KEY, [])
  const shown = pickVisible(rooms, visibleIds, r => r.id)
  const [selectedId, setSelectedId] = useState<string>(favoriteId)
  const [expanded, setExpanded] = useState(false)
  const actions = useHueActions()

  // Fall back to the favourite room after a period without switching rooms
  useEffect(() => {
    if (!favoriteId || selectedId === favoriteId) return
    const t = setTimeout(() => setSelectedId(favoriteId), FAVORITE_REVERT_MS)
    return () => clearTimeout(t)
  }, [selectedId, favoriteId])

  const room    = shown.find(r => r.id === selectedId)
    ?? shown.find(r => r.id === favoriteId)
    ?? shown[0]
  const isFavorite = !!room && room.id === favoriteId
  const accent  = room ? roomAccent(room, '#ffb35c') : '#ffb35c'
  const onCount = room ? litLights(room).length : 0
  const bri     = room ? avgBrightnessPct(room) : 0

  return (
    <div ref={ref} className="relative flex h-full flex-col overflow-hidden">
      {/* Soft light spill in the room's colour */}
      <motion.div
        className="pointer-events-none absolute -right-1/4 -top-1/3 h-2/3 w-2/3 rounded-full blur-3xl"
        animate={{ backgroundColor: accent, opacity: room?.anyOn ? 0.18 + bri / 600 : 0 }}
        transition={{ duration: 0.8 }}
      />

      {shown.length > 1 && (
        <div className="relative z-10 flex shrink-0 gap-1 overflow-x-auto p-3 pb-0 scrollbar-hide">
          {shown.map(r => {
            const active = r.id === room?.id
            return (
              <button key={r.id} onClick={() => setSelectedId(r.id)}
                className={cn('relative shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
                  active ? 'text-zinc-950' : 'text-fg2 hover:text-fg')}>
                {active && <motion.span layoutId="mini-hue-room" transition={spring} className="absolute inset-0 rounded-xl bg-white" />}
                <span className="relative z-10 flex items-center gap-1.5">
                  {r.id === favoriteId && <Star className={cn('h-3 w-3', active ? 'fill-zinc-950' : 'fill-current')} />}
                  {r.anyOn && <span className="h-1.5 w-1.5 rounded-full" style={{ background: roomAccent(r, '#ffb35c'), boxShadow: `0 0 6px ${roomAccent(r, '#ffb35c')}` }} />}
                  {r.name}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {!room ? (
        <EmptyState icon={<Lightbulb className="h-5 w-5" />} title="Geen lampen" hint="Controleer de Hue bridge in appsettings.json" />
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 scrollbar-hide">
          <div className="flex shrink-0 items-center gap-3">
            <BulbBadge on={room.anyOn} accent={accent} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{room.name}</p>
              <p className="text-xs text-fg3 tabular">{room.anyOn ? `${onCount} van ${room.lights.length} aan` : 'Uit'}</p>
            </div>
            <button onClick={() => setFavoriteId(isFavorite ? '' : room.id)}
              title={isFavorite ? 'Favoriet verwijderen' : 'Als favoriet instellen'}
              className={cn('shrink-0 rounded-lg p-1.5 transition-colors', isFavorite ? 'text-amber-400' : 'text-fg3 hover:text-fg2')}>
              <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
            </button>
            <Toggle on={room.anyOn} accent={accent} onChange={v => actions.toggleRoom(room.id, v)} />
          </div>

          <AnimatePresence initial={false}>
            {room.anyOn && (
              <motion.div key="bri" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }} className="shrink-0">
                <BrightnessSlider value={bri} accent={accent} onChange={v => actions.dimRoom(room.id, v)} />
              </motion.div>
            )}
          </AnimatePresence>

          {h > 200 && room.anyOn && <SceneChips roomId={room.id} />}

          {h > 250 && room.lights.length > 0 && (
            <button onClick={() => setExpanded(e => !e)}
              className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-fg3 transition-colors hover:text-fg2">
              <motion.span animate={{ rotate: expanded ? 0 : -90 }} transition={spring}><ChevronDown className="h-3.5 w-3.5" /></motion.span>
              Lampen
            </button>
          )}

          <AnimatePresence initial={false}>
            {h > 250 && expanded && (
              <motion.div key="lights"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex shrink-0 flex-col divide-y divide-subtle overflow-hidden">
                {room.lights.map(light => (
                  <div key={light.id} className="py-2">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-full transition-all duration-500"
                        style={{ background: light.isOn ? accent : 'var(--c-elev2)', boxShadow: light.isOn ? `0 0 8px ${accent}` : 'none' }} />
                      <span className={cn('flex-1 truncate text-xs', light.isOn ? 'text-fg' : 'text-fg3', !light.isReachable && 'line-through opacity-60')}>{light.name}</span>
                      <Toggle size="sm" on={light.isOn} accent={accent} disabled={!light.isReachable}
                        onChange={on => actions.toggleLight(light.id, on)} />
                    </div>
                    {light.isOn && (
                      <div className="mt-1.5 pl-4">
                        <BrightnessSlider compact value={Math.round((light.brightness / 254) * 100)} accent={accent}
                          onChange={pct => actions.dimLight(light.id, pct)} />
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

