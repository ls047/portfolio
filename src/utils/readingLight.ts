/**
 * Mirror of `.tire-decoration` on the right: same strip width, but centered on the left edge.
 * Tire: `width: min(22vw, 320px); right: 0` → bright core ≈ `min(11vw, 160px)` from the left.
 */
export const TIRE_STRIP_VW = 22;
export const TIRE_STRIP_MAX_PX = 320;

/** Tuned with `.reading-chars-visual` + page radial (smaller spotlight = higher threshold). */
export const READING_LIGHT_THRESHOLD = 0.4;

export function getLightCenterPx(viewportWidth: number, viewportHeight: number): {
  x: number;
  y: number;
} {
  const stripHalf = Math.min((viewportWidth * TIRE_STRIP_VW) / 100, TIRE_STRIP_MAX_PX) / 2;
  /** Keep in sync with `layout/index.vue` `--reading-light-y` */
  const yFrac = viewportWidth <= 768 ? 0.2 : 0.5;
  return { x: stripHalf, y: viewportHeight * yFrac };
}

/** Strict binary ink for reading / contrast helpers */
export const READING_INK_ON_LIGHT = '#000000';
export const READING_INK_ON_DARK = '#ffffff';

/**
 * ~1 = center of headlight (bright), ~0 = vignette (dark).
 * Tuned to match the current radial stops (small bright core).
 */
export function sampleLightStrength(px: number, py: number): number {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const { x: cx, y: cy } = getLightCenterPx(w, h);
  const dist = Math.hypot(px - cx, py - cy);
  const maxD = Math.max(
    Math.hypot(cx, cy),
    Math.hypot(w - cx, cy),
    Math.hypot(cx, h - cy),
    Math.hypot(w - cx, h - cy),
    1
  );
  const r = Math.min(1, dist / maxD);
  /* Smaller spotlight vs 0.62 — falloff starts closer to center */
  return Math.max(0, Math.min(1, 1 - Math.pow(r / 0.52, 1.15)));
}

/** True → dark text on bright glow; false → light text on dark vignette */
export function isOnLightBackground(px: number, py: number): boolean {
  return sampleLightStrength(px, py) > READING_LIGHT_THRESHOLD;
}

export function readingInkAtPoint(px: number, py: number): string {
  return isOnLightBackground(px, py) ? READING_INK_ON_LIGHT : READING_INK_ON_DARK;
}
