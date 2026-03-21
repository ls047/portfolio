import type { DirectiveBinding, ObjectDirective } from 'vue';
import { syncReadingVisualInks } from '../utils/syncReadingVisualInks';

/** After mount, `el.textContent` is not reliable (sr-only + visual). */
const lastFullText = new WeakMap<HTMLElement, string>();

function resolveFullText(
  el: HTMLElement,
  binding: DirectiveBinding<string | undefined>,
  phase: 'mount' | 'update'
): string {
  if (binding.value != null) {
    const t = String(binding.value);
    lastFullText.set(el, t);
    return t;
  }
  if (phase === 'mount') {
    const t = (el.textContent ?? '').replace(/\u00a0/g, ' ');
    lastFullText.set(el, t);
    return t;
  }
  return lastFullText.get(el) ?? '';
}

/** Whitespace (incl. newlines) stays as text nodes; words get `.reading-word` for ink sync. */
function appendVisualTokens(wrap: HTMLElement, fullText: string): void {
  const normalized = fullText.replace(/\r/g, '');
  const tokens = normalized.split(/(\s+)/);

  for (const token of tokens) {
    if (token === '') continue;
    if (/^\s+$/.test(token)) {
      wrap.appendChild(document.createTextNode(token));
      continue;
    }
    const span = document.createElement('span');
    span.className = 'reading-word';
    span.textContent = token;
    wrap.appendChild(span);
  }
}

function rebuild(el: HTMLElement, fullText: string): void {
  if (el.dataset.readingCharsText === fullText) return;
  el.dataset.readingCharsText = fullText;

  el.replaceChildren();

  if (!fullText) return;

  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = fullText.replace(/\r/g, '');
  el.appendChild(sr);

  const wrap = document.createElement('span');
  wrap.className = 'reading-chars-visual';
  wrap.setAttribute('aria-hidden', 'true');
  appendVisualTokens(wrap, fullText);

  el.appendChild(wrap);

  requestAnimationFrame(() => {
    const scrollRoot = el.closest('.content-scroll') as HTMLElement | null;
    if (scrollRoot) syncReadingVisualInks(scrollRoot);
  });
}

export const readingChars: ObjectDirective<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    rebuild(el, resolveFullText(el, binding, 'mount'));
  },
  updated(el, binding) {
    rebuild(el, resolveFullText(el, binding, 'update'));
  },
  beforeUnmount(el) {
    lastFullText.delete(el);
    delete el.dataset.readingCharsText;
    el.replaceChildren();
  },
};
