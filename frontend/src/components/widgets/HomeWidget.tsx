import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { GripVertical, X, Plus, Minus, Columns2, Columns3, Square, EyeOff, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { fadeUp, softSpring, spring } from '@/components/ui/motion'
import { useCompactColumns } from './home/shared'
import { HueTileConfig, AircoTileConfig, SystemTileConfig, EnergyTileConfig, RingTileConfig, TravelTileConfig, CalendarTileConfig } from './home/TileConfig'
import { MiniCalendar } from './home/MiniCalendar'
import { MiniTravel } from './home/MiniTravel'
import { MiniRing } from './home/MiniRing'
import { MiniWeather } from './home/MiniWeather'
import { MiniMusic } from './home/MiniMusic'
import { MiniHue } from './home/MiniHue'
import { MiniSystem } from './home/MiniSystem'
import { MiniAirco } from './home/MiniAirco'
import { MiniAfval } from './home/MiniAfval'
import { MiniPlex } from './home/MiniPlex'
import { MiniEnergy } from './home/MiniEnergy'

// ── Layout types ───────────────────────────────────────────────────────────────
type Column     = number // column index (0 = leftmost)
type WidgetId   = 'weather' | 'music' | 'lighting' | 'system' | 'airco' | 'afval' | 'plex' | 'energy' | 'ring' | 'calendar' | 'travel'
type WidgetSpan = 'full' | 'half'

interface HomeLayout {
  cols:    WidgetId[][]                          // widgets per column, left to right
  colFlex: number[]                              // width weight per column
  flexMap: Partial<Record<WidgetId, number>>     // per-widget height weight
  spanMap: Partial<Record<WidgetId, WidgetSpan>> // per-widget width
}

const MIN_COLS = 1, MAX_COLS = 6

const DEFAULT_LAYOUT: HomeLayout = {
  cols:    [['weather', 'music'], ['lighting', 'system'], ['airco', 'afval', 'plex']],
  colFlex: [1, 1.5, 1],
  flexMap: {},
  spanMap: {},
}

const WIDGET_META: Record<WidgetId, {
  label: string; flex: number; mobileHeight: number; render: () => React.ReactNode
  config?: { title: string; render: () => React.ReactNode } // optional per-tile settings
}> = {
  weather:  { label: 'Weer',          flex: 1, mobileHeight: 220, render: () => <MiniWeather /> },
  music:    { label: 'Muziek',        flex: 2, mobileHeight: 260, render: () => <MiniMusic /> },
  lighting: { label: 'Verlichting',   flex: 1, mobileHeight: 300, render: () => <MiniHue />,
              config: { title: 'Ruimtes', render: () => <HueTileConfig /> } },
  system:   { label: 'Systeem',       flex: 2, mobileHeight: 270, render: () => <MiniSystem />,
              config: { title: 'Onderdelen', render: () => <SystemTileConfig /> } },
  airco:    { label: 'Airco',         flex: 1, mobileHeight: 300, render: () => <MiniAirco />,
              config: { title: "Airco's", render: () => <AircoTileConfig /> } },
  afval:    { label: 'Afvalkalender', flex: 1, mobileHeight: 220, render: () => <MiniAfval /> },
  plex:     { label: 'Plex',          flex: 2, mobileHeight: 280, render: () => <MiniPlex /> },
  energy:   { label: 'Energie',       flex: 1, mobileHeight: 300, render: () => <MiniEnergy />,
              config: { title: 'Onderdelen', render: () => <EnergyTileConfig /> } },
  ring:     { label: 'Deurbel',       flex: 2, mobileHeight: 280, render: () => <MiniRing />,
              config: { title: 'Camera & meldingen', render: () => <RingTileConfig /> } },
  calendar: { label: 'Agenda',        flex: 2, mobileHeight: 280, render: () => <MiniCalendar />,
              config: { title: "Agenda's", render: () => <CalendarTileConfig /> } },
  travel:   { label: 'Reistijd',      flex: 2, mobileHeight: 300, render: () => <MiniTravel />,
              config: { title: 'Onderdelen', render: () => <TravelTileConfig /> } },
}
const ALL_IDS = Object.keys(WIDGET_META) as WidgetId[]

/** Layout as saved by versions with exactly three columns. */
type LegacyLayout = Partial<HomeLayout> & {
  left?: WidgetId[]; middle?: WidgetId[]; right?: WidgetId[]
  colFlex?: number[] | { left?: number; middle?: number; right?: number }
}

/** Repairs layouts saved by older versions (unknown ids, missing fields, fixed three columns). */
function sanitize(input: HomeLayout | LegacyLayout | null | undefined): HomeLayout {
  const raw = (input ?? {}) as LegacyLayout
  const seen = new Set<WidgetId>()
  const clean = (ids: unknown): WidgetId[] =>
    (Array.isArray(ids) ? ids : []).filter((id): id is WidgetId => {
      if (!ALL_IDS.includes(id as WidgetId) || seen.has(id as WidgetId)) return false
      seen.add(id as WidgetId)
      return true
    })
  let cols: WidgetId[][]
  let flex: unknown[]
  if (Array.isArray(raw.cols) && raw.cols.length > 0) {
    cols = raw.cols.slice(0, MAX_COLS).map(clean)
    flex = Array.isArray(raw.colFlex) ? raw.colFlex : []
  } else if (raw.left || raw.middle || raw.right) {
    cols = [clean(raw.left), clean(raw.middle), clean(raw.right)]
    const f = (raw.colFlex && !Array.isArray(raw.colFlex) ? raw.colFlex : {}) as { left?: number; middle?: number; right?: number }
    flex = [f.left, f.middle, f.right]
  } else {
    cols = DEFAULT_LAYOUT.cols.map(clean)
    flex = DEFAULT_LAYOUT.colFlex
  }
  return {
    cols,
    colFlex: cols.map((_, i) => (typeof flex[i] === 'number' && (flex[i] as number) > 0 ? flex[i] as number : 1)),
    flexMap: raw.flexMap ?? {},
    spanMap: raw.spanMap ?? {},
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

/** Settings sheet that slides over a tile (e.g. which rooms the light tile shows). */
function ConfigSheet({ id, onClose }: { id: WidgetId; onClose: () => void }) {
  const cfg = WIDGET_META[id].config
  if (!cfg) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-30 flex flex-col overflow-hidden rounded-3xl bg-[var(--c-solid)]"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-subtle px-4 py-3">
        <p className="label-caps">{WIDGET_META[id].label} · {cfg.title}</p>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
          className="rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold">Klaar</motion.button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-hide">{cfg.render()}</div>
    </motion.div>
  )
}

/** Follows one pointer (mouse, finger or pen) until it is released. */
function trackPointer(e: React.PointerEvent, onMove: (ev: PointerEvent) => void, onEnd: (ev: PointerEvent | null) => void) {
  e.preventDefault()
  e.stopPropagation()
  const id = e.pointerId
  const move = (ev: PointerEvent) => { if (ev.pointerId === id) onMove(ev) }
  const up = (ev: PointerEvent) => {
    if (ev.pointerId !== id) return
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', up)
    onEnd(ev.type === 'pointercancel' ? null : ev)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}

type DropLine = { left: number; top: number; width: number }
type DragState = { id: WidgetId; x: number; y: number }

/** Floating label that follows the finger/mouse while moving a tile, plus the drop indicator. */
function DragOverlay({ drag, line }: { drag: DragState | null; line: DropLine | null }) {
  if (!drag) return null
  return createPortal(
    <>
      {line && (
        <div className="pointer-events-none fixed z-[90] h-1 rounded-full bg-orange-400 shadow-[0_0_16px_rgba(251,146,60,.8)] transition-[top,left,width] duration-100"
          style={{ left: line.left, top: line.top - 2, width: line.width }} />
      )}
      <div className="pointer-events-none fixed z-[91] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-2xl border border-orange-400/50 bg-[var(--c-solid)] px-4 py-2.5 text-sm font-semibold text-fg shadow-2xl"
        style={{ left: drag.x, top: drag.y }}>
        <GripVertical className="h-4 w-4 text-orange-400" />{WIDGET_META[drag.id].label}
      </div>
    </>,
    document.body,
  )
}

export function HomeWidget({ editMode }: { editMode: boolean }) {
  const compactCols = useCompactColumns()
  const [configId, setConfigId] = useState<WidgetId | null>(null)
  if (!editMode && configId) setConfigId(null)

  const configButton = (id: WidgetId, className: string) => WIDGET_META[id].config && (
    <motion.button
      initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}
      whileTap={{ scale: 0.85 }}
      onClick={() => setConfigId(c => c === id ? null : id)}
      className={cn(chip, 'absolute top-2.5 p-2 hover:text-orange-300', className)}
      title="Instellingen"
    >
      <SlidersHorizontal className="h-4 w-4" />
    </motion.button>
  )
  const [layoutRaw, setLayoutRaw] = useLocalStorage<HomeLayout | LegacyLayout>('home-layout', DEFAULT_LAYOUT)
  const layout = sanitize(layoutRaw)
  const setLayout = (fn: (prev: HomeLayout) => HomeLayout) => setLayoutRaw(prev => fn(sanitize(prev)))

  const [mobileOrder,   setMobileOrder]   = useLocalStorage<WidgetId[]>('mobile-widget-order', [])
  const [mobileHeights, setMobileHeights] = useLocalStorage<Partial<Record<WidgetId, number>>>('mobile-widget-heights', {})

  // Dragging a tile + where it would land
  const [drag, setDrag] = useState<DragState | null>(null)
  const [dropLine, setDropLine] = useState<DropLine | null>(null)
  // Live sizes while resizing (committed to storage on release)
  const [liveRows, setLiveRows] = useState<Record<string, number> | null>(null)
  const [liveCols, setLiveCols] = useState<number[] | null>(null)
  const [liveH, setLiveH] = useState<{ id: WidgetId; h: number } | null>(null)
  const resizing = !!(liveRows || liveCols || liveH)

  const colRefs = useRef<(HTMLDivElement | null)[]>([])
  const colWrapRefs = useRef<(HTMLDivElement | null)[]>([])
  const compactRef = useRef<HTMLDivElement | null>(null)

  const COLUMNS: Column[] = layout.cols.map((_, i) => i)
  const allUsed       = layout.cols.flat()
  const hiddenWidgets = ALL_IDS.filter(id => !allUsed.includes(id))

  // ── Layout mutations ─────────────────────────────────────────────────────────
  const getFlex = (id: WidgetId) => layout.flexMap[id] ?? WIDGET_META[id].flex
  const getSpan = (id: WidgetId): WidgetSpan => layout.spanMap[id] ?? 'full'
  const getColFlex = (col: Column) => (liveCols ?? layout.colFlex)[col] ?? 1

  function moveWidget(id: WidgetId, col: Column, idx: number) {
    setLayout(prev => {
      const from = prev.cols.findIndex(c => c.includes(id))
      if (from < 0 || !prev.cols[col]) return prev
      const cols = prev.cols.map(c => [...c])
      cols[from] = cols[from].filter(w => w !== id)
      let at = from === col && prev.cols[col].indexOf(id) < idx ? idx - 1 : idx
      at = Math.max(0, Math.min(at, cols[col].length))
      cols[col].splice(at, 0, id)
      return { ...prev, cols }
    })
  }

  const removeWidget = (id: WidgetId) => setLayout(p => ({ ...p, cols: p.cols.map(c => c.filter(w => w !== id)) }))
  const addWidget    = (id: WidgetId, col: Column) =>
    setLayout(p => ({ ...p, cols: p.cols.map((c, i) => (i === Math.min(col, p.cols.length - 1) ? [...c, id] : c)) }))

  /** Adds an empty column on the right. */
  const addColumn = () => setLayout(p => p.cols.length >= MAX_COLS ? p : ({ ...p, cols: [...p.cols, []], colFlex: [...p.colFlex, 1] }))
  /** Removes a column; its widgets move to the neighbouring column so nothing gets lost. */
  const removeColumn = (col: Column) => setLayout(p => {
    if (p.cols.length <= MIN_COLS) return p
    const cols = p.cols.map(c => [...c])
    const [moved] = cols.splice(col, 1)
    const target = Math.max(0, col - 1)
    cols[target] = [...cols[target], ...moved]
    return { ...p, cols, colFlex: p.colFlex.filter((_, i) => i !== col) }
  })
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

  // ── Desktop: drag a tile to another place ────────────────────────────────────
  function computeDrop(x: number, y: number): { col: Column; idx: number; line: DropLine } | null {
    let col: Column | null = null, best = Infinity
    for (const c of COLUMNS) {
      const r = colRefs.current[c]?.getBoundingClientRect()
      if (!r) continue
      const d = x < r.left ? r.left - x : x > r.right ? x - r.right : 0
      if (d < best) { best = d; col = c }
    }
    if (col == null) return null
    const list = colRefs.current[col]!
    const lr = list.getBoundingClientRect()
    const rows = [...list.querySelectorAll<HTMLElement>(':scope > [data-row]')]
    if (rows.length === 0) return { col, idx: 0, line: { left: lr.left, top: lr.top + 6, width: lr.width } }
    for (const el of rows) {
      const r = el.getBoundingClientRect()
      if (y < r.top + r.height / 2) return { col, idx: Number(el.dataset.start), line: { left: r.left, top: r.top - 6, width: r.width } }
    }
    const last = rows[rows.length - 1].getBoundingClientRect()
    return { col, idx: layout.cols[col].length, line: { left: last.left, top: last.bottom + 6, width: last.width } }
  }

  function startMove(e: React.PointerEvent, id: WidgetId) {
    let target: { col: Column; idx: number } | null = null
    setDrag({ id, x: e.clientX, y: e.clientY })
    trackPointer(e, ev => {
      setDrag({ id, x: ev.clientX, y: ev.clientY })
      const d = computeDrop(ev.clientX, ev.clientY)
      target = d && { col: d.col, idx: d.idx }
      setDropLine(d?.line ?? null)
    }, ev => {
      if (ev && target) moveWidget(id, target.col, target.idx)
      setDrag(null); setDropLine(null)
    })
  }

  // ── Desktop: drag the gap between two tiles to change their heights ─────────
  function startRowResize(e: React.PointerEvent, col: Column, r: number) {
    const list = colRefs.current[col]
    if (!list) return
    const els = [...list.querySelectorAll<HTMLElement>(':scope > [data-row]')]
    const heights = els.map(el => el.getBoundingClientRect().height)
    const rows = buildRows(layout.cols[col])
    const y0 = e.clientY, MIN = 90
    let hs = heights
    const toFlex = (h: number[]) => Object.fromEntries(rows.map((row, i) => [row.items.join('+'), Math.round(h[i]) / 100]))
    trackPointer(e, ev => {
      const dy = ev.clientY - y0
      let a = heights[r] + dy, b = heights[r + 1] - dy
      if (a < MIN) { b -= MIN - a; a = MIN }
      if (b < MIN) { a -= MIN - b; b = MIN }
      hs = [...heights]; hs[r] = a; hs[r + 1] = b
      setLiveRows(toFlex(hs))
    }, ev => {
      if (ev) {
        const flex = toFlex(hs)
        setLayout(p => {
          const fm = { ...p.flexMap }
          for (const row of rows) for (const id of row.items) fm[id] = flex[row.items.join('+')]
          return { ...p, flexMap: fm }
        })
      }
      setLiveRows(null)
    })
  }

  // ── Desktop: drag the gap between two columns to change their widths ────────
  function startColResize(e: React.PointerEvent, i: number) {
    const widths = COLUMNS.map(c => colWrapRefs.current[c]?.getBoundingClientRect().width ?? 0)
    const x0 = e.clientX, MIN = 160
    let ws = widths
    const toFlex = (w: number[]) => w.map(x => Math.max(0.5, Math.round(x) / 100))
    trackPointer(e, ev => {
      const dx = ev.clientX - x0
      let a = widths[i] + dx, b = widths[i + 1] - dx
      if (a < MIN) { b -= MIN - a; a = MIN }
      if (b < MIN) { a -= MIN - b; b = MIN }
      ws = [...widths]; ws[i] = a; ws[i + 1] = b
      setLiveCols(toFlex(ws))
    }, ev => {
      if (ev) setLayout(p => ({ ...p, colFlex: toFlex(ws) }))
      setLiveCols(null)
    })
  }

  // ── Renderers ────────────────────────────────────────────────────────────────
  const gripChip = (onDown: (e: React.PointerEvent) => void, className?: string) => (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}
      onPointerDown={onDown}
      className={cn(chip, 'absolute left-2.5 top-2.5 cursor-grab touch-none p-2 active:cursor-grabbing', className)}
      title="Slepen om te verplaatsen"
    >
      <GripVertical className="h-4 w-4" />
    </motion.div>
  )

  let cellIndex = 0
  function renderCell(id: WidgetId) {
    const i = cellIndex++
    return (
      <motion.div
        key={id}
        layout={resizing ? false : 'position'}
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
              {gripChip(e => startMove(e, id))}
              <motion.button
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}
                whileTap={{ scale: 0.85 }}
                onClick={() => removeWidget(id)}
                className={cn(chip, 'absolute right-2.5 top-2.5 p-2 hover:text-red-400')}
                title="Verbergen"
              >
                <X className="h-4 w-4" />
              </motion.button>
              {configButton(id, 'right-[3.25rem]')}
              <motion.div
                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring}
                className={cn(chip, 'absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1 py-0.5 pl-1 pr-1.5')}
              >
                <span onPointerDown={e => startMove(e, id)} title="Slepen om te verplaatsen"
                  className="flex cursor-grab touch-none items-center gap-1 px-1.5 py-1 active:cursor-grabbing">
                  <GripVertical className="h-3 w-3 text-zinc-400" />
                  <span className="max-w-[7rem] truncate text-xs font-medium">{WIDGET_META[id].label}</span>
                </span>
                <span className="mx-0.5 h-3 w-px bg-white/20" />
                <IconBtn onClick={() => toggleSpan(id)} title={getSpan(id) === 'half' ? 'Volle breedte' : 'Halve breedte (naast elkaar)'}>
                  {getSpan(id) === 'half' ? <Square className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
                </IconBtn>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {editMode && configId === id && <ConfigSheet id={id} onClose={() => setConfigId(null)} />}
        </AnimatePresence>
      </motion.div>
    )
  }

  /** Gap between two rows/columns; in edit mode it is a grab bar for resizing. */
  const resizeGap = (key: string, dir: 'row' | 'col', onDown?: (e: React.PointerEvent) => void) => {
    const row = dir === 'row'
    if (!editMode || !onDown) return <div key={key} className={row ? 'h-3 shrink-0' : 'w-3 shrink-0'} />
    return (
      <div key={key} onPointerDown={onDown} title={row ? 'Sleep om de hoogte aan te passen' : 'Sleep om de breedte aan te passen'}
        className={cn('group relative z-10 flex shrink-0 touch-none items-center justify-center',
          row ? 'h-3 cursor-row-resize' : 'w-3 cursor-col-resize')}>
        {/* Larger invisible hit area for fingers */}
        <span className={cn('absolute', row ? '-inset-y-2 inset-x-0' : '-inset-x-2 inset-y-0')} />
        <span className={cn('rounded-full bg-orange-400/50 transition-all group-hover:bg-orange-400 group-active:bg-orange-400',
          row ? 'h-1 w-12 group-hover:w-20' : 'h-12 w-1 group-hover:h-20')} />
      </div>
    )
  }

  function renderColumn(col: Column) {
    const widgets  = layout.cols[col]
    const rows     = buildRows(widgets)

    return (
      <div key={col} ref={el => { colWrapRefs.current[col] = el }} className="flex min-h-0 min-w-0 flex-col"
        style={{ flex: getColFlex(col), transition: liveCols ? 'none' : 'flex .4s cubic-bezier(.16,1,.3,1)' }}>
        <div ref={el => { colRefs.current[col] = el }} className="flex min-h-0 flex-1 flex-col">
          {rows.map(({ items, startIdx, rowFlex }, r) => (
            <React.Fragment key={items.join('+')}>
              {r > 0 && resizeGap('g', 'row', e => startRowResize(e, col, r - 1))}
              <div data-row data-start={startIdx} className="flex min-h-0 gap-3" style={{ flex: liveRows?.[items.join('+')] ?? rowFlex }}>
                {items.map(id => renderCell(id))}
              </div>
            </React.Fragment>
          ))}

          {editMode && widgets.length === 0 && (
            <div className={cn('flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed text-fg3 transition-colors',
              drag ? 'border-orange-400/70 bg-orange-400/5' : 'border-subtle2')}>
              <Plus className="h-5 w-5" />
              <p className="text-xs">Sleep hier een widget</p>
              {layout.cols.length > MIN_COLS && (
                <button onClick={() => removeColumn(col)}
                  className="mt-1 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-fg3 transition-colors hover:bg-red-500/10 hover:text-red-400">
                  <X className="h-3 w-3" /> Kolom weghalen
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Hidden widgets tray (edit mode) ──────────────────────────────────────────
  const hiddenTray = (
    <AnimatePresence>
      {editMode && hiddenWidgets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          transition={softSpring}
          className="panel flex shrink-0 flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-center sm:gap-4"
        >
          <p className="flex shrink-0 items-center gap-1.5 label-caps"><EyeOff className="h-3.5 w-3.5" />Verborgen</p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {hiddenWidgets.map(id => (
              <motion.div layout key={id} className="flex items-center gap-1.5 rounded-xl bg-card3 py-1 pl-3 pr-1">
                <span className="text-xs font-medium text-fg">{WIDGET_META[id].label}</span>
                {compactCols ? (
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => addWidget(id, COLUMNS.length - 1)}
                    className="rounded-lg px-2 py-1 text-[11px] text-fg2 transition-colors hover:bg-accent hover:text-white">
                    + Toevoegen
                  </motion.button>
                ) : (
                  <>
                    <span className="text-[11px] text-fg3">+ kolom</span>
                    {COLUMNS.map(col => (
                      <motion.button key={col} whileTap={{ scale: 0.9 }} onClick={() => addWidget(id, col)} title={`Toevoegen aan kolom ${col + 1}`}
                        className="min-w-[1.75rem] rounded-lg px-2 py-1 text-[11px] font-medium text-fg2 transition-colors hover:bg-accent hover:text-white">
                        {col + 1}
                      </motion.button>
                    ))}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ── Compact (phone, portrait tablet, landscape phone): scrollable masonry ────
  if (compactCols) {
    const base = mobileOrder.length > 0 ? mobileOrder : allUsed
    const ordered = [...base.filter(id => allUsed.includes(id)), ...allUsed.filter(id => !base.includes(id))]
    const getH = (id: WidgetId) => mobileHeights[id] ?? WIDGET_META[id].mobileHeight
    const shownH = (id: WidgetId) => (liveH?.id === id ? liveH.h : getH(id))
    const removeCompact = (id: WidgetId) => {
      removeWidget(id)
    }

    function computeCompactDrop(x: number, y: number, dragged: WidgetId) {
      const cells = [...(compactRef.current?.querySelectorAll<HTMLElement>('[data-ccell]') ?? [])]
      let best: { el: HTMLElement; d: number } | null = null
      for (const el of cells) {
        const r = el.getBoundingClientRect()
        const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0
        const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0
        const d = dx * 3 + dy // prefer the column under the finger
        if (!best || d < best.d) best = { el, d }
      }
      if (!best) return null
      const target = best.el.dataset.ccell as WidgetId
      if (target === dragged) return null
      const r = best.el.getBoundingClientRect()
      const before = y < r.top + r.height / 2
      return { target, before, line: { left: r.left, top: before ? r.top - 6 : r.bottom + 6, width: r.width } }
    }

    function startCompactMove(e: React.PointerEvent, id: WidgetId) {
      let target: { target: WidgetId; before: boolean } | null = null
      let last = { x: e.clientX, y: e.clientY }
      let raf = 0
      // Scroll the page when the finger is near the top/bottom edge
      const autoScroll = () => {
        const sc = compactRef.current
        if (sc) {
          const r = sc.getBoundingClientRect(), edge = 70
          const speed = last.y < r.top + edge ? -(r.top + edge - last.y) / 8 : last.y > r.bottom - edge ? (last.y - (r.bottom - edge)) / 8 : 0
          if (speed) {
            sc.scrollTop += speed
            const d = computeCompactDrop(last.x, last.y, id)
            target = d && { target: d.target, before: d.before }
            setDropLine(d?.line ?? null)
          }
        }
        raf = requestAnimationFrame(autoScroll)
      }
      raf = requestAnimationFrame(autoScroll)
      setDrag({ id, x: e.clientX, y: e.clientY })
      trackPointer(e, ev => {
        last = { x: ev.clientX, y: ev.clientY }
        setDrag({ id, x: ev.clientX, y: ev.clientY })
        const d = computeCompactDrop(ev.clientX, ev.clientY, id)
        target = d && { target: d.target, before: d.before }
        setDropLine(d?.line ?? null)
      }, ev => {
        cancelAnimationFrame(raf)
        if (ev && target) {
          const next = ordered.filter(w => w !== id)
          const at = next.indexOf(target.target) + (target.before ? 0 : 1)
          next.splice(at, 0, id)
          setMobileOrder(next)
        }
        setDrag(null); setDropLine(null)
      })
    }

    function startHeightResize(e: React.PointerEvent, id: WidgetId) {
      const h0 = getH(id), y0 = e.clientY
      let h = h0
      setLiveH({ id, h })
      trackPointer(e, ev => {
        h = Math.max(120, Math.min(900, Math.round((h0 + ev.clientY - y0) / 10) * 10))
        setLiveH({ id, h })
      }, ev => {
        if (ev) setMobileHeights(m => ({ ...m, [id]: h }))
        setLiveH(null)
      })
    }

    // Greedy masonry: each tile goes into the currently shortest column (stored heights, so it doesn't reshuffle mid-resize)
    const columns: WidgetId[][] = Array.from({ length: compactCols }, () => [])
    const colH = Array<number>(compactCols).fill(0)
    for (const id of ordered) {
      const c = colH.indexOf(Math.min(...colH))
      columns[c].push(id)
      colH[c] += getH(id)
    }

    const renderCompactCell = (id: WidgetId) => {
      const idx = ordered.indexOf(id)
      return (
        <motion.div
          key={id}
          data-ccell={id}
          layout={resizing ? false : true}
          transition={softSpring}
          variants={fadeUp} initial="hidden" animate="show" custom={idx}
          className={cn('panel relative shrink-0 overflow-hidden rounded-3xl transition-opacity', editMode && 'ring-1 ring-orange-400/30', drag?.id === id && 'opacity-30')}
          style={{ height: shownH(id) }}
        >
          {WIDGET_META[id].render()}
          <AnimatePresence>
            {editMode && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 z-20 bg-black/10">
                {gripChip(e => startCompactMove(e, id))}
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => removeCompact(id)}
                  className={cn(chip, 'absolute right-2.5 top-2.5 p-2 hover:text-red-400')} title="Verbergen">
                  <X className="h-4 w-4" />
                </motion.button>
                {configButton(id, 'right-[3.25rem]')}
                <div onPointerDown={e => startCompactMove(e, id)}
                  className={cn(chip, 'absolute bottom-5 left-1/2 flex -translate-x-1/2 cursor-grab touch-none items-center gap-1.5 px-2.5 py-1')}>
                  <GripVertical className="h-3 w-3 text-zinc-400" />
                  <span className="max-w-[8rem] truncate text-xs font-medium">{WIDGET_META[id].label}</span>
                  {liveH?.id === id && <span className="text-[11px] text-orange-300 tabular">{liveH.h}px</span>}
                </div>
                {/* Bottom edge: pull to change the height */}
                <div onPointerDown={e => startHeightResize(e, id)} title="Sleep om de hoogte aan te passen"
                  className="pointer-events-auto absolute inset-x-0 bottom-0 flex h-4 cursor-row-resize touch-none items-end justify-center pb-1">
                  <span className={cn('h-1 rounded-full transition-all', liveH?.id === id ? 'w-24 bg-orange-400' : 'w-14 bg-orange-400/60')} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {editMode && configId === id && <ConfigSheet id={id} onClose={() => setConfigId(null)} />}
          </AnimatePresence>
        </motion.div>
      )
    }

    return (
      <div ref={compactRef} className="flex h-full flex-col gap-3 overflow-y-auto pb-6 scrollbar-hide">
        {hiddenTray}
        {editMode && <p className="px-1 text-xs text-fg3">Sleep een tegel aan het grip-icoon naar een andere plek. Trek de onderrand omlaag om hem hoger te maken.</p>}
        <div className="flex items-start gap-3">
          {columns.map((ids, c) => (
            <div key={c} className="flex min-w-0 flex-1 flex-col gap-3">
              {ids.map(renderCompactCell)}
            </div>
          ))}
        </div>
        <DragOverlay drag={drag} line={dropLine} />
      </div>
    )
  }

  // ── Desktop: flexible columns (1–6) ──────────────────────────────────────────
  const columnControls = (
    <AnimatePresence>
      {editMode && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={softSpring}
          className="flex shrink-0 items-center justify-center gap-3">
          <div className="panel flex items-center gap-1 rounded-2xl py-1 pl-3 pr-1">
            <Columns3 className="h-4 w-4 text-fg3" />
            <span className="mr-1 text-xs font-medium text-fg2">Kolommen</span>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => removeColumn(COLUMNS.length - 1)} disabled={COLUMNS.length <= MIN_COLS}
              title="Laatste kolom weghalen (tegels schuiven naar links)"
              className="rounded-xl p-2 text-fg2 transition-colors hover:bg-card3 hover:text-fg disabled:opacity-30">
              <Minus className="h-4 w-4" />
            </motion.button>
            <span className="w-5 text-center text-sm font-semibold tabular text-fg">{COLUMNS.length}</span>
            <motion.button whileTap={{ scale: 0.85 }} onClick={addColumn} disabled={COLUMNS.length >= MAX_COLS} title="Kolom toevoegen"
              className="rounded-xl p-2 text-fg2 transition-colors hover:bg-card3 hover:text-fg disabled:opacity-30">
              <Plus className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="flex h-full flex-col gap-3">
      {columnControls}
      <div className="flex min-h-0 flex-1">
        {COLUMNS.map((col, i) => (
          <React.Fragment key={col}>
            {i > 0 && resizeGap('g', 'col', e => startColResize(e, i - 1))}
            {renderColumn(col)}
          </React.Fragment>
        ))}
      </div>
      {editMode && <p className="-mt-1 shrink-0 text-center text-xs text-fg3">Sleep tegels aan het grip-icoon · sleep de oranje streepjes tussen tegels en kolommen om de grootte aan te passen</p>}
      {hiddenTray}
      <DragOverlay drag={drag} line={dropLine} />
    </div>
  )
}
