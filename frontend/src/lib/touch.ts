/**
 * Long-pressing with a finger opens the browser's context menu (copy / open link / save image),
 * which gets in the way of dragging tiles and reading charts. Block it for touch and pen only —
 * right-clicking with a mouse keeps working, and so do text fields.
 */
export function blockTouchContextMenu() {
  let lastPointer = 'mouse'
  window.addEventListener('pointerdown', e => { lastPointer = e.pointerType }, { capture: true, passive: true })
  window.addEventListener('contextmenu', e => {
    const type = (e as PointerEvent).pointerType || lastPointer
    if (type !== 'touch' && type !== 'pen') return
    if ((e.target as HTMLElement | null)?.closest('input, textarea, [contenteditable="true"]')) return
    e.preventDefault()
  }, { capture: true })
}
