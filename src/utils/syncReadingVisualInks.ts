import { readingInkAtPoint } from './readingLight';

/**
 * Per-word spans (`.reading-word`) — same `readingInkAtPoint` as section themes; fewer nodes than per-char.
 */
export function syncReadingVisualInks(scrollRoot: HTMLElement): void {
  const nodes = scrollRoot.querySelectorAll<HTMLElement>('.reading-word');
  const samples: { el: HTMLElement; px: number; py: number }[] = [];

  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    samples.push({
      el,
      px: r.left + r.width / 2,
      py: r.top + r.height / 2,
    });
  }

  for (const { el, px, py } of samples) {
    const ink = readingInkAtPoint(px, py);
    el.style.setProperty('--reading-ink-sync', ink);
    el.style.setProperty('color', ink, 'important');
    el.style.setProperty('-webkit-text-fill-color', ink, 'important');
    el.style.setProperty('caret-color', ink);
    el.style.removeProperty('background-image');
    el.style.removeProperty('background-attachment');
    el.style.removeProperty('background-clip');
    el.style.removeProperty('-webkit-background-clip');
    el.style.removeProperty('background-repeat');
    el.style.removeProperty('background-position');
    el.style.removeProperty('background-size');
  }
}
