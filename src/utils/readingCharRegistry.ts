import { readingInkAtPoint } from './readingLight';

const hostToSpans = new Map<HTMLElement, Set<HTMLElement>>();

export function registerReadingCharSpan(span: HTMLElement, host: HTMLElement): void {
  let set = hostToSpans.get(host);
  if (!set) {
    set = new Set();
    hostToSpans.set(host, set);
  }
  set.add(span);
}

/** Remove all span registrations for a host (before rebuild or unmount). */
export function unregisterReadingCharHost(host: HTMLElement): void {
  const set = hostToSpans.get(host);
  if (set) {
    set.clear();
    hostToSpans.delete(host);
  }
}

export function refreshReadingCharColors(): void {
  for (const set of hostToSpans.values()) {
    for (const s of set) {
      if (!s.isConnected) continue;
      const r = s.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const px = r.left + r.width / 2;
      const py = r.top + r.height / 2;
      const ink = readingInkAtPoint(px, py);
      s.style.setProperty('color', ink, 'important');
    }
  }
}
