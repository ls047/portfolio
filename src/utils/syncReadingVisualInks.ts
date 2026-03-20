import { readingInkAtPoint } from './readingLight';

function sampleElementCenter(el: HTMLElement): { px: number; py: number } | null {
  let r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) {
    const section = el.closest('.section');
    const anchor = section?.querySelector<HTMLElement>('.section-content') ?? section;
    if (anchor) r = anchor.getBoundingClientRect();
  }
  if (r.width === 0 && r.height === 0) return null;
  return {
    px: r.left + r.width / 2,
    py: r.top + r.height / 2,
  };
}

function applyReadingInkSync(el: HTMLElement, px: number, py: number): void {
  const ink = readingInkAtPoint(px, py);
  el.style.setProperty('--reading-ink-sync', ink);
  el.style.removeProperty('background-image');
  el.style.removeProperty('background-attachment');
  el.style.removeProperty('background-clip');
  el.style.removeProperty('-webkit-background-clip');
  el.style.removeProperty('background-repeat');
  el.style.removeProperty('background-position');
  el.style.removeProperty('background-size');
}

/**
 * `.reading-word` + `.reading-icon`: same `readingInkAtPoint`. Use `.reading-icon` on a wrapper
 *  without Vue `:style` so `--reading-ink-sync` is not cleared when `AppIcon` updates `fontSize`.
 * `.reading-border`: border/stroke only (sample at element center).
 */
export function syncReadingVisualInks(scrollRoot: HTMLElement): void {
  const inkTargets = scrollRoot.querySelectorAll<HTMLElement>('.reading-word, .reading-icon');
  for (const el of inkTargets) {
    const c = sampleElementCenter(el);
    if (!c) continue;
    applyReadingInkSync(el, c.px, c.py);
  }

  const chromeNodes = scrollRoot.querySelectorAll<HTMLElement>('.reading-border');
  for (const el of chromeNodes) {
    const c = sampleElementCenter(el);
    if (!c) continue;
    const ink = readingInkAtPoint(c.px, c.py);
    el.style.setProperty(
      '--reading-border-sync',
      `color-mix(in srgb, ${ink} 22%, transparent)`
    );
  }
}
