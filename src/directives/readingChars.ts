import type { DirectiveBinding, ObjectDirective } from 'vue';
import {
  registerReadingCharSpan,
  unregisterReadingCharHost,
  refreshReadingCharColors,
} from '../utils/readingCharRegistry';

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

function rebuild(el: HTMLElement, fullText: string): void {
  if (el.dataset.readingCharsText === fullText) return;
  el.dataset.readingCharsText = fullText;

  unregisterReadingCharHost(el);
  el.replaceChildren();

  if (!fullText) return;

  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = fullText;
  el.appendChild(sr);

  const wrap = document.createElement('span');
  wrap.className = 'reading-chars-visual';
  wrap.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < fullText.length; i++) {
    const ch = fullText[i];
    if (ch === '\n') {
      wrap.appendChild(document.createElement('br'));
      continue;
    }
    if (ch === '\r') continue;

    const s = document.createElement('span');
    s.className = 'reading-char';
    s.textContent = ch === ' ' ? '\u00a0' : ch;
    wrap.appendChild(s);
    registerReadingCharSpan(s, el);
  }

  el.appendChild(wrap);
  refreshReadingCharColors();
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
    unregisterReadingCharHost(el);
    el.replaceChildren();
  },
};
