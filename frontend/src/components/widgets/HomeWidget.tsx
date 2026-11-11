import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GripVertical, X, Plus, Minus, ChevronDown, ChevronUp, Columns2, Square, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { fadeUp, softSpring, spring } from '@/components/ui/motion'
import { useIsMobile } from './home/shared'
import { MiniWeather } from './home/MiniWeather'
import { MiniMusic } from './home/MiniMusic'
import { MiniHue } from './home/MiniHue'
import { MiniSystem } from './home/MiniSystem'
import { MiniAirco } from './home/MiniAirco'
import { MiniAfval } from './home/MiniAfval'
import { MiniPlex } from './home/MiniPlex'

// ── Layout types ───────────────────────────────────────────────────────────────
type Column     = 'left' | 'middle' | 'right'
type WidgetId   = 'weather' | 'music' | 'lighting' | 'system' | 'airco' | 'afval' | 'plex'
type WidgetSpan = 'full' | 'half'

interface HomeLayout {
  left:    WidgetId[]
  middle:  WidgetId[]
  right:   WidgetId[]
  flexMap: Partial<Record<WidgetId, number>>     // per-widget height weight
  spanMap: Partial<Record<WidgetId, WidgetSpan>> // per-widget width
  colFlex: { left: number; middle: number; right: number }
}

const COLUMNS: Column[] = ['left', 'middle', 'right']
const COL_LABEL: Record<Column, string> = { left: 'Links', middle: 'Midden', right: 'Rechts' }

const DEFAULT_LAYOUT: HomeLayout = {
  left:    ['weather', 'music'],
  middle:  ['lighting', 'system'],
  right:   ['airco', 'afval', 'plex'],
  flexMap: {},
  spanMap: {},
  colFlex: { left: 1, middle: 1.5, right: 1 },
}

const WIDGET_META: Record<WidgetId, { label: string; flex: number; mobileHeight: number; render: () => React.ReactNode }> = {
  weather:  { label: 'Weer',          flex: 1, mobileHeight: 220, render: () => <MiniWeather /> },
  music:    { label: 'Muziek',        flex: 2, mobileHeight: 260, render: () => <MiniMusic /> },
  lighting: { label: 'Verlichting',   flex: 1, mobileHeight: 300, render: () => <MiniHue /> },
  system:   { label: 'Systeem',       flex: 2, mobileHeight: 270, render: () => <MiniSystem /> },
  airco:    { label: 'Airco',         flex: 1, mobileHeight: 300, render: () => <MiniAirco /> },
  afval:    { label: 'Afvalkalender', flex: 1, mobileHeight: 220, render: () => <MiniAfval /> },
  plex:     { label: 'Plex',          flex: 2, mobileHeight: 280, render: () => <MiniPlex /> },
}
const ALL_IDS = Object.keys(WIDGET_META) as WidgetId[]

/** Repairs layouts saved by older versions (unknown ids, missing fields). */
function sanitize(raw: Partial<HomeLayout> | null | undefined): HomeLayout {
  const seen = new Set<WidgetId>()
  const clean = (ids: unknown): WidgetId[] =>
    (Array.isArray(ids) ? ids : []).filter((id): id is WidgetId => {
      if (!ALL_IDS.includes(id as WidgetId) || seen.has(id as WidgetId)) return false
      seen.add(id as WidgetId)
      return true
    })
  return {
    left:    clean(raw?.left ?? DEFAULT_LAYOUT.left),
    middle:  clean(raw?.middle ?? DEFAULT_LAYOUT.middle),
    right:   clean(raw?.right ?? DEFAULT_LAYOUT.right),
    flexMap: raw?.flexMap ?? {},
    spanMap: raw?.spanMap ?? {},
    colFlex: { ...DEFAULT_LAYOUT.colFlex, ...(raw?.colFlex ?? {}) },
  }
}

// ── Glass control chip used by edit overlays ──────────────────────────────────
const chip = 'pointer-events-auto rounded-xl border border-white/10 bg-black/60 text-zinc-200 backdrop-blur-md shadow-lg'

function IconBtn({ onClick, disabled, title, children, className }: {
  onClick: () => void; disabled?: boolean; title?: string; children: React.ReactNode; className?: string
}) {
  return (
    <motion.button whileTap={{ scale: 0.85 }} onClick={onClick} disabled={disabled} title={title}
      className={cn('p-1 text-zinc-300 transition-colors hover:text-white disabled:opacity-30', className)}>
      {children}
    </motion.button>
  )
}

export function HomeWidget({ editMode }: { editMode: boolean }) {
  const isMobile = useIsMobile()
  const [layoutRaw, setLayoutRaw] = useLocalStorage<HomeLayout>('home-layout', DEFAULT_LAYOUT)
  const layout = sanitize(layoutRaw)
  const setLayout = (fn: (prev: HomeLayout) => HomeLayout) => setLayoutRaw(prev => fn(sanitize(prev)))

  const [mobileOrder,   setMobileOrder]   = useLocalStorage<WidgetId[]>('mobile-widget-order', [])
  const [mobileHeights, setMobileHeights] = useLocalStorage<Partial<Record<WidgetId, number>>>('mobile-widget-heights', {})

  const [drag, setDrag] = useState<{ id: WidgetId; col: Column } | null>(null)
  const [drop, setDrop] = useState<{ col: Column; idx: number } | null>(null)

  const allUsed       = [...layout.left, ...layout.middle, ...layout.right]
  const hiddenWidgets = ALL_IDS.filter(id => !allUsed.includes(id))

  // ── Layout mutations ─────────────────────────────────────────────────────────
  const getFlex = (id: WidgetId) => layout.flexMap[id] ?? WIDGET_META[id].flex
  const getSpan = (id: WidgetId): WidgetSpan => layout.spanMap[id] ?? 'full'
  const getColFlex = (col: Column) => layout.colFlex[col]

  function handleDrop(col: Column, idx: number) {
    if (!drag) return
    const { id, col: from } = drag
    setLayout(prev => {
      const n: HomeLayout = { ...prev, left: [...prev.left], middle: [...prev.middle], right: [...prev.right] }
      n[from] = n[from].filter(w => w !== id)
      let at = from === col && prev[col].indexOf(id) < idx ? idx - 1 : idx
      at = Math.max(0, Math.min(at, n[col].length))
      n[col].splice(at, 0, id)
      return n
    })
    setDrag(null); setDrop(null)
  }

  const removeWidget = (id: WidgetId, col: Column) => setLayout(p => ({ ...p, [col]: p[col].filter(w => w !== id) }))
  const addWidget    = (id: WidgetId, col: Column) => setLayout(p => ({ ...p, [col]: [...p[col], id] }))
  const adjustFlex   = (id: WidgetId, d: number) =>
    setLayout(p => ({ ...p, flexMap: { ...p.flexMap, [id]: Math.max(1, Math.min(6, (p.flexMap[id] ?? WIDGET_META[id].flex) + d)) } }))
  const adjustColFlex = (col: Column, d: number) =>
    setLayout(p => ({ ...p, colFlex: { ...p.colFlex, [col]: Math.max(0.5, Math.min(4, Math.round((p.colFlex[col] + d * 0.5) * 10) / 10)) } }))
  const toggleSpan = (id: WidgetId) =>
    setLayout(p => ({ ...p, spanMap: { ...p.spanMap, [id]: (p.spanMap[id] ?? 'full') === 'full' ? 'half' : 'full' } }))

  // Consecutive 'half' widgets are paired side by side.
  function buildRows(widgets: WidgetId[]) {
    const rows: { items: WidgetId[]; startIdx: number; rowFlex: number }[] = []
    for (let i = 0; i < widgets.length;) {
      const id = widgets[i], id2 = widgets[i + 1]
      if (getSpan(id) === 'half' && id2 && getSpan(id2) === 'half') {
        rows.push({ items: [id, id2], startIdx: i, rowFlex: Math.max(getFlex(id), getFlex(id2)) })
        i += 2
      } else {
        rows.push({ items: [id], startIdx: i, rowFlex: getFlex(id) })
        i += 1
      }
    }
    return rows
  }

  // ── Renderers ────────────────────────────────────────────────────────────────
  const renderDropLine = (col: Column, idx: number) => {
    const isTarget = drop?.col === col && drop.idx === idx
    return (
      <motion.div
        key={`drop-${col}-${idx}`}
        layout
        className={cn(
          'shrink-0 rounded-2xl transition-colors',
          isTarget ? 'flex h-12 items-center justify-center border-2 border-dashed border-orange-400/80 bg-orange-400/10' : 'h-3',
        )}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (!isTarget) setDrop({ col, idx }) }}
        onDrop={e => { e.preventDefault(); handleDrop(col, idx) }}
      >
        {isTarget && <Plus className="h-4 w-4 text-orange-400" />}
      </motion.div>
    )
  }

  let cellIndex = 0
  function renderCell(id: WidgetId, col: Column) {
    const i = cellIndex++
    return (
      <motion.div
        key={id}
        layout="position"
        transition={softSpring}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={i}
        className={cn(
          'panel relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl transition-[opacity,box-shadow] duration-300',
          editMode && 'ring-1 ring-orange-400/30',
          drag?.id === id && 'opacity-30',
        )}
      >
        {WIDGET_META[id].render()}

        <AnimatePresence>
          {editMode && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-20 rounded-3xl bg-black/10"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}
                className="absolute left-2.5 top-2.5"
              >
                <div
                  draggable
                  onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDrag({ id, col }) }}
                  onDragEnd={() => { setDrag(null); setDrop(null) }}
                  className={cn(chip, 'cursor-grab p-1.5 active:cursor-grabbing')}
                  title="Slepen om te verplaatsen"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
              </motion.div>
              <motion.button
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}
                whileTap={{ scale: 0.85 }}
                onClick={() => removeWidget(id, col)}
                className={cn(chip, 'absolute right-2.5 top-2.5 p-1.5 hover:text-red-400')}
                title="Verbergen"
              >
                <X className="h-4 w-4" />
              </motion.button>
              <motion.div
                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring}
                className={cn(chip, 'absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5 px-1.5 py-0.5')}
              >
                <IconBtn onClick={() => adjustFlex(id, -1)} disabled={getFlex(id) <= 1} title="Lager"><Minus className="h-3 w-3" /></IconBtn>
                <span className="w-20 truncate text-center text-xs font-medium">{WIDGET_META[id].label}</span>
                <IconBtn onClick={() => adjustFlex(id, 1)} disabled={getFlex(id) >= 6} title="Hoger"><Plus className="h-3 w-3" /></IconBtn>
                <span className="mx-0.5 h-3 w-px bg-white/20" />
                <IconBtn onClick={() => toggleSpan(id)} title={getSpan(id) === 'half' ? 'Volle breedte' : 'Halve breedte'}>
                  {getSpan(id) === 'half' ? <Square className="h-3 w-3" /> : <Columns2 className="h-3 w-3" />}
                </IconBtn>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  function renderColumn(col: Column) {
    const widgets  = layout[col]
    const rows     = buildRows(widgets)
    const dragging = editMode && !!drag

    return (
      <div key={col} className="flex min-h-0 min-w-0 flex-col" style={{ flex: getColFlex(col), transition: 'flex .4s cubic-bezier(.16,1,.3,1)' }}>
        <AnimatePresence initial={false}>
          {editMode && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="panel flex shrink-0 items-center justify-center gap-1 overflow-hidden rounded-xl px-2 py-1"
            >
              <IconBtn onClick={() => adjustColFlex(col, -1)} disabled={getColFlex(col) <= 0.5} className="text-fg2 hover:text-fg"><Minus className="h-3 w-3" /></IconBtn>
              <span className="w-24 text-center text-xs text-fg2 tabular">{COL_LABEL[col]} · {getColFlex(col).toFixed(1)}</span>
              <IconBtn onClick={() => adjustColFlex(col, 1)} disabled={getColFlex(col) >= 4} className="text-fg2 hover:text-fg"><Plus className="h-3 w-3" /></IconBtn>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex min-h-0 flex-1 flex-col">
          {dragging && renderDropLine(col, 0)}
          {rows.map(({ items, startIdx, rowFlex }) => (
            <React.Fragment key={items.join('+')}>
              {startIdx > 0 && !dragging && <div className="h-3 shrink-0" />}
              <div className="flex min-h-0 gap-3" style={{ flex: rowFlex }}>
                {items.map(id => renderCell(id, col))}
              </div>
              {dragging && renderDropLine(col, startIdx + items.length)}
            </React.Fragment>
          ))}

          {editMode && widgets.length === 0 && (
            <div
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed text-fg3 transition-colors',
                drop?.col === col ? 'border-orange-400 bg-orange-400/10' : 'border-subtle2',
              )}
              onDragOver={e => { e.preventDefault(); setDrop({ col, idx: 0 }) }}
              onDrop={e => { e.preventDefault(); handleDrop(col, 0) }}
            >
              <Plus className="h-5 w-5" />
              <p className="text-xs">Sleep hier een widget</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Mobile: single scrollable column ─────────────────────────────────────────
  if (isMobile) {
    const base = mobileOrder.length > 0 ? mobileOrder : allUsed
    const ordered = [...base.filter(id => allUsed.includes(id)), ...allUsed.filter(id => !base.includes(id))]
    const getH = (id: WidgetId) => mobileHeights[id] ?? WIDGET_META[id].mobileHeight
    const adjustH = (id: WidgetId, d: number) => setMobileHeights(h => ({ ...h, [id]: Math.max(120, Math.min(600, getH(id) + d)) }))
    const move = (id: WidgetId, dir: -1 | 1) => {
      const cur = [...ordered]
      const idx = cur.indexOf(id), to = idx + dir
      if (to < 0 || to >= cur.length) return
      ;[cur[idx], cur[to]] = [cur[to], cur[idx]]
      setMobileOrder(cur)
    }

    return (
      <div className="flex h-full flex-col gap-3 overflow-y-auto pb-6 scrollbar-hide">
        {ordered.map((id, idx) => (
          <motion.div
            key={id}
            layout
            transition={softSpring}
            variants={fadeUp} initial="hidden" animate="show" custom={idx}
            className={cn('panel relative shrink-0 overflow-hidden rounded-3xl', editMode && 'ring-1 ring-orange-400/30')}
            style={{ height: getH(id) }}
          >
            {WIDGET_META[id].render()}
            <AnimatePresence>
              {editMode && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 z-20 bg-black/10">
                  <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => move(id, -1)} disabled={idx === 0} className={cn(chip, 'p-1.5 disabled:opacity-30')}>
                      <ChevronUp className="h-4 w-4" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => move(id, 1)} disabled={idx === ordered.length - 1} className={cn(chip, 'p-1.5 disabled:opacity-30')}>
                      <ChevronDown className="h-4 w-4" />
                    </motion.button>
                  </div>
                  <div className={cn(chip, 'absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5 px-1.5 py-0.5')}>
                    <IconBtn onClick={() => adjustH(id, -30)} disabled={getH(id) <= 120}><Minus className="h-3 w-3" /></IconBtn>
                    <span className="w-24 truncate text-center text-xs font-medium">{WIDGET_META[id].label}</span>
                    <IconBtn onClick={() => adjustH(id, 30)} disabled={getH(id) >= 600}><Plus className="h-3 w-3" /></IconBtn>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    )
  }

  // ── Desktop: three flexible columns ──────────────────────────────────────────
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex min-h-0 flex-1 gap-3">
        {COLUMNS.map(renderColumn)}
      </div>

      <AnimatePresence>
        {editMode && hiddenWidgets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={softSpring}
            className="panel flex shrink-0 items-center gap-4 rounded-3xl p-4"
          >
            <p className="flex shrink-0 items-center gap-1.5 label-caps"><EyeOff className="h-3.5 w-3.5" />Verborgen</p>
            <div className="flex flex-wrap gap-3">
              {hiddenWidgets.map(id => (
                <motion.div layout key={id} className="flex items-center gap-1.5 rounded-xl bg-card3 py-1 pl-3 pr-1">
                  <span className="text-xs font-medium text-fg">{WIDGET_META[id].label}</span>
                  {COLUMNS.map(col => (
                    <motion.button key={col} whileTap={{ scale: 0.9 }} onClick={() => addWidget(id, col)}
                      className="rounded-lg px-2 py-1 text-[11px] text-fg2 transition-colors hover:bg-accent hover:text-white">
                      + {COL_LABEL[col]}
                    </motion.button>
                  ))}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
