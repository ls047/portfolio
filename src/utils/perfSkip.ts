/**
 * Skip heavy WebGL (car + CCTV preload) for paths where Lighthouse / low-end devices
 * pay too much in TBT/LCP. Wide desktop keeps the full intro; below-lg viewports skip unless ?full=1.
 *
 * ?full=1 — force full 3D intro even on mobile.
 * ?lite=1 — force light path even on desktop (testing).
 */

export function shouldSkipHeavyIntro(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('full') === '1') return false;
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

  /* Phone + tablet (below lg): car+GLB+CCTV dominate TBT/LCP on Lighthouse & real devices. ?full=1 for full 3D. */
  if (window.matchMedia('(max-width: 1023px)').matches) {
    return true;
  }

  return false;
}
