import { readingInkAtPoint } from './readingLight';

/**
 * Per-word spans (`.reading-word`) — same `readingInkAtPoint` as section themes; fewer nodes than per-char.
 */
export function syncReadingVisualInks(scrollRoot: HTMLElement): void {
  const nodes = scrollRoot.querySelectorAll<HTMLElement>('.reading-word');
  const samples: { el: HTMLElement; px: number; py: number }[] = [];

  for (const el of nodes) {
    let r = el.getBoundingClientRect();
    /* Unrevealed genie / compositor oddities can yield 0×0 — sample from section column */
    if (r.width === 0 && r.height === 0) {
      const section = el.closest('.section');
      const anchor = section?.querySelector<HTMLElement>('.section-content') ?? section;
      if (anchor) r = anchor.getBoundingClientRect();
    }
    if (r.width === 0 && r.height === 0) continue;
    samples.push({
      el,
      px: r.left + r.width / 2,
      py: r.top + r.height / 2,
    });
  }

  for (const { el, px, py } of samples) {
    const ink = readingInkAtPoint(px, py);
    /* Only CSS var — layout transitions color / fill from this */
    el.style.setProperty('--reading-ink-sync', ink);
    el.style.removeProperty('background-image');
    el.style.removeProperty('background-attachment');
    el.style.removeProperty('background-clip');
    el.style.removeProperty('-webkit-background-clip');
    el.style.removeProperty('background-repeat');
    el.style.removeProperty('background-position');
    el.style.removeProperty('background-size');
  }
}
