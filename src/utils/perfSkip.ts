/**
 * Skip heavy WebGL (car + CCTV preload) only when the user opts out or the device/network
 * clearly can’t handle it well (reduced motion, save-data, 2G).
 *
 * ?lite=1 — force light path (no car) for testing or low-end checks.
 */

export function shouldSkipHeavyIntro(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('lite') === '1') return true;
  } catch {
    /* ignore */
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }

  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (conn?.saveData) return true;
  const et = conn?.effectiveType;
  if (et === 'slow-2g' || et === '2g') return true;

  return false;
}
