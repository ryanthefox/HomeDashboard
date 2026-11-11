export function formatBps(bps: number): string {
  if (bps < 1024)               return `${Math.round(bps)} B/s`
  if (bps < 1024 * 1024)        return `${(bps / 1024).toFixed(1)} KB/s`
  if (bps < 1024 * 1024 * 1024) return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`
  return `${(bps / (1024 * 1024 * 1024)).toFixed(2)} GB/s`
}

export function formatGb(gb: number): string {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`
  return `${gb.toFixed(0)} GB`
}

/** Combined usage of all drives (falls back to the API's single disk % when no drives are listed). */
export function diskTotals(disks: { usedGb: number; totalGb: number }[], fallbackPercent = 0) {
  const totalGb = disks.reduce((s, d) => s + d.totalGb, 0)
  const usedGb  = disks.reduce((s, d) => s + d.usedGb, 0)
  const freeGb  = Math.max(0, totalGb - usedGb)
  const percent = totalGb > 0 ? (usedGb / totalGb) * 100 : fallbackPercent
  return { totalGb, usedGb, freeGb, percent, hasDrives: totalGb > 0 }
}
