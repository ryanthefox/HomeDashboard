import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_SCREENS } from '@/lib/homeScreens'
import { spring } from '@/components/ui/motion'

/** Page dots under the home screen; in edit mode also add/remove screen. */
export function HomeScreenBar({ count, current, editMode, onSelect, onAdd, onDelete }: {
  count: number; current: number; editMode: boolean
  onSelect: (i: number) => void; onAdd: () => void; onDelete: () => void
}) {
  const [armed, setArmed] = useState(false)
  useEffect(() => { setArmed(false) }, [current, editMode])
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t) }, [armed])

  if (count <= 1 && !editMode) return null
  return (
    <div className="flex shrink-0 items-center justify-center gap-3 pt-2">
      {editMode && count > 1 && (
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.9 }}
          onClick={() => { if (armed) { setArmed(false); onDelete() } else setArmed(true) }}
          className={cn('flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors',
            armed ? 'bg-red-500 text-white' : 'bg-card3 text-fg2 hover:text-red-400')}
          title="Dit scherm verwijderen">
          <Trash2 className="h-3.5 w-3.5" />{armed ? 'Zeker?' : 'Scherm'}
        </motion.button>
      )}

      <div className="flex items-center gap-1 rounded-full bg-card3 px-2 py-1.5" role="tablist" aria-label="Homeschermen">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} onClick={() => onSelect(i)} role="tab" aria-selected={i === current} aria-label={`Scherm ${i + 1}`}
            className="flex h-4 items-center justify-center px-0.5">
            <motion.span layout transition={spring}
              className={cn('block h-1.5 rounded-full transition-colors', i === current ? 'w-5' : 'w-1.5')}
              style={{ background: i === current ? 'var(--c-fg)' : 'var(--c-fg3)', opacity: i === current ? 1 : 0.6 }} />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {editMode && count < MAX_SCREENS && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} whileTap={{ scale: 0.9 }}
            onClick={onAdd} title="Nieuw homescherm"
            className="flex h-8 items-center gap-1.5 rounded-xl bg-card3 px-2.5 text-xs font-medium text-fg2 transition-colors hover:text-fg">
            <Plus className="h-3.5 w-3.5" />Scherm
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
