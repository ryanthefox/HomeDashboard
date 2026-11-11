import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Centered modal over a dimmed backdrop. Closes on backdrop click and Escape. */
export function Dialog({ open, onClose, title, children, className }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onPointerDown={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            role="dialog" aria-modal
            initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn('panel flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-[var(--c-solid)]', className)}
          >
            {title && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-subtle px-5 py-3.5">
                <div className="min-w-0 truncate font-semibold text-fg">{title}</div>
                <button onClick={onClose} aria-label="Sluiten" className="rounded-lg p-1.5 text-fg3 transition-colors hover:bg-card3 hover:text-fg">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
