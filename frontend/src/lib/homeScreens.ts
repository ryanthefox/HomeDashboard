/**
 * Multiple home screens. Screen 0 keeps the original storage keys (so existing
 * layouts stay), screen n uses "<key>-<n+1>". Count and current screen are stored too.
 */
export const MAX_SCREENS = 5
export const SCREENS_KEY = 'home-screens'
export const SCREEN_KEY = 'home-screen'
const PER_SCREEN = ['home-layout', 'mobile-widget-order', 'mobile-widget-heights'] as const
/** Layout of a new (empty) screen: three empty columns. */
export const EMPTY_SCREEN_LAYOUT = { cols: [[], [], []], colFlex: [1, 1, 1], flexMap: {}, spanMap: {} }

export const screenKey = (base: (typeof PER_SCREEN)[number], screen: number) => (screen === 0 ? base : `${base}-${screen + 1}`)

/** Removes screen `index` and shifts the later screens one place down. */
export function deleteScreenStorage(index: number, count: number) {
  try {
    for (const base of PER_SCREEN) {
      for (let i = index; i < count - 1; i++) {
        const next = localStorage.getItem(screenKey(base, i + 1))
        // An untouched extra screen is empty — don't let screen 0 fall back to its default widgets
        if (next === null && base === 'home-layout') localStorage.setItem(screenKey(base, i), JSON.stringify(EMPTY_SCREEN_LAYOUT))
        else if (next === null) localStorage.removeItem(screenKey(base, i))
        else localStorage.setItem(screenKey(base, i), next)
      }
      localStorage.removeItem(screenKey(base, count - 1))
    }
  } catch { /* storage unavailable */ }
}
