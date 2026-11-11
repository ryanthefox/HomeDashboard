import { useState, useCallback, useEffect } from 'react'

const EVENT = 'local-storage-sync'

function read<T>(key: string, initial: T): T {
  try {
    const item = localStorage.getItem(key)
    return item !== null ? (JSON.parse(item) as T) : initial
  } catch {
    return initial
  }
}

/**
 * State persisted in localStorage. Every component using the same key stays in
 * sync (e.g. a settings panel and the tile it configures).
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => read(key, initial))

  useEffect(() => {
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string; value: T }>).detail
      if (detail?.key === key) setValue(detail.value)
    }
    window.addEventListener(EVENT, onSync)
    return () => window.removeEventListener(EVENT, onSync)
  }, [key])

  const set = useCallback((val: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val
      try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* quota */ }
      // Notify other hook instances after this render pass
      queueMicrotask(() => window.dispatchEvent(new CustomEvent(EVENT, { detail: { key, value: next } })))
      return next
    })
  }, [key])

  return [value, set]
}
