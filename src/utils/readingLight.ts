/** Legacy tire strip sizing (still used if other code imports). */
export const TIRE_STRIP_VW = 22;
export const TIRE_STRIP_MAX_PX = 320;

/**
 * Above this strength → black ink / “on light” section theme.
 * Lower = tighter bright core (flips to light-on-dark ink sooner as you leave center).
 */
export const READING_LIGHT_THRESHOLD = 0.32;

/**
 * Pixel center of the radial spotlight — keep in sync with `layout/index.vue`.
 * Mobile (≤768px): top center. Larger: left mirror of tire strip, mid-height.
 */
export function getLightCenterPx(viewportWidth: number, viewportHeight: number): {
  x: number;
  y: number;
} {
  if (viewportWidth <= 768) {
    return { x: viewportWidth / 2, y: viewportHeight * 0.06 };
  }
  /* Match layout `--reading-light-x: min(13vw, 185px)` (nudged toward viewport center vs tire strip). */
  return {
    x: Math.min((viewportWidth * 13) / 100, 185),
    y: viewportHeight * 0.5,
  };
}

/** Strict binary ink for contrast helpers / section chrome */
export const READING_INK_ON_LIGHT = '#000000';
export const READING_INK_ON_DARK = '#ffffff';

function smoothstep01(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Maps light strength → grayscale ink (white … grays … black).
 * Wider overlap = smoother color change as text crosses glow ↔ vignette.
 */
export function readingInkMixFromStrength(s: number): string {
  const lo = 0.12;
  const hi = 0.46;
  const t = smoothstep01(lo, hi, Math.max(0, Math.min(1, s)));
  const v = Math.round(255 * (1 - t));
  return `rgb(${v} ${v} ${v})`;
}

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
  /* Steeper falloff vs CSS radial — ink/theme track visible glow ↔ vignette more tightly */
  const core = 0.36;
  const gamma = 1.32;
  return Math.max(0, Math.min(1, 1 - Math.pow(r / core, gamma)));
}

/** True → dark text on bright glow; false → light text on dark vignette */
export function isOnLightBackground(px: number, py: number): boolean {
  return sampleLightStrength(px, py) > READING_LIGHT_THRESHOLD;
}

/** Per-pixel ink for reading chars — smooth ramp (not a hard flip). */
export function readingInkAtPoint(px: number, py: number): string {
  return readingInkMixFromStrength(sampleLightStrength(px, py));
}
