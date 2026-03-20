import { watch, nextTick, onBeforeUnmount, type Ref } from 'vue';
import { sampleLightStrength, READING_LIGHT_THRESHOLD } from '../utils/readingLight';
import { syncReadingVisualInks } from '../utils/syncReadingVisualInks';

function applySectionTheme(section: HTMLElement, onLight: boolean) {
  const mode = onLight ? 'light' : 'dark';
  if (section.dataset.reading === mode) return;

  if (onLight) {
    /* Spotlight: text strictly black / UI neutrals from black+white only */
    section.style.setProperty('--section-heading', '#000000');
    section.style.setProperty('--section-body', '#000000');
    section.style.setProperty('--section-muted', '#000000');
    section.style.setProperty('--section-subtle', '#000000');
    section.style.setProperty('--section-link', '#000000');
    section.style.setProperty('--section-link-hover', '#000000');
    section.style.setProperty('--section-divider', 'rgba(0, 0, 0, 0.14)');
    section.style.setProperty('--section-chip-bg', 'rgba(0, 0, 0, 0.08)');
    section.style.setProperty('--section-chip-text', '#000000');
    section.style.setProperty('--section-progress-track', 'rgba(0, 0, 0, 0.18)');
    section.style.setProperty('--section-progress-track-shade', 'rgba(0, 0, 0, 0.12)');
    section.style.setProperty('--skills-track-border', 'rgba(0, 0, 0, 0.12)');
    section.style.setProperty('--skills-track-highlight', 'rgba(0, 0, 0, 0.06)');
    section.style.setProperty('--skills-ink', '#000000');
    section.style.setProperty('--skills-muted', '#000000');
    section.style.setProperty('--skills-faint', '#000000');
  } else {
    /* Vignette: strictly white text */
    section.style.setProperty('--section-heading', '#ffffff');
    section.style.setProperty('--section-body', '#ffffff');
    section.style.setProperty('--section-muted', '#ffffff');
    section.style.setProperty('--section-subtle', '#ffffff');
    section.style.setProperty('--section-link', '#ffffff');
    section.style.setProperty('--section-link-hover', '#ffffff');
    section.style.setProperty('--section-divider', 'rgba(255, 255, 255, 0.2)');
    section.style.setProperty('--section-chip-bg', 'rgba(255, 255, 255, 0.14)');
    section.style.setProperty('--section-chip-text', '#ffffff');
    section.style.setProperty('--section-progress-track', 'rgba(255, 255, 255, 0.22)');
    section.style.setProperty('--section-progress-track-shade', 'rgba(0, 0, 0, 0.35)');
    section.style.setProperty('--skills-track-border', 'rgba(255, 255, 255, 0.18)');
    section.style.setProperty('--skills-track-highlight', 'rgba(255, 255, 255, 0.08)');
    section.style.setProperty('--skills-ink', '#ffffff');
    section.style.setProperty('--skills-muted', '#ffffff');
    section.style.setProperty('--skills-faint', '#ffffff');
  }

  section.dataset.reading = mode;
}

export function useReadingContrast(scrollContainerRef: Ref<HTMLElement | null>): {
  forceReadingUpdate: () => void;
} {
  let cleanup: (() => void) | undefined;
  let rafId = 0;

  function update() {
    if (typeof document !== 'undefined' && document.hidden) return;

    const root = scrollContainerRef.value;
    if (!root) return;

    const sections = root.querySelectorAll<HTMLElement>('.section');
    sections.forEach((section) => {
      const anchor = section.querySelector('.section-content') ?? section;
      const rect = anchor.getBoundingClientRect();
      const px = rect.left + rect.width / 2;
      /* Vertical strip: section often crosses glow + vignette — blend samples */
      const ys = [0.22, 0.5, 0.78].map((t) => rect.top + rect.height * t);
      let strength = 0;
      for (const py of ys) {
        strength += sampleLightStrength(px, py);
      }
      strength /= ys.length;
      applySectionTheme(section, strength > READING_LIGHT_THRESHOLD);
    });
    /* Ink must run after theme so --reading-ink-sync matches the same geometry pass */
    syncInkImmediate();
  }

  /** Every physical scroll tick — ink must track before next paint (rAF batching alone feels “stuck”). */
  function syncInkImmediate() {
    const root = scrollContainerRef.value;
    if (root) syncReadingVisualInks(root);
  }

  function scheduleUpdate() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      update();
    });
  }

  /** Same work as scroll/resize: section themes + ink (no rAF wait). For post-animation layout. */
  function forceReadingUpdate() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    update();
  }

  function onScrollOrResize() {
    syncInkImmediate();
    scheduleUpdate();
  }

  function onVisibilityChange() {
    if (typeof document !== 'undefined' && !document.hidden) {
      syncInkImmediate();
      scheduleUpdate();
    }
  }

  function setup() {
    const el = scrollContainerRef.value;
    if (!el) return;

    el.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    scheduleUpdate();
    syncInkImmediate();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      el.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }

  watch(
    scrollContainerRef,
    async (scrollEl) => {
      cleanup?.();
      if (scrollEl) {
        await nextTick();
        cleanup = setup();
      }
    },
    { immediate: true, flush: 'post' }
  );

  onBeforeUnmount(() => {
    cleanup?.();
  });

  return { forceReadingUpdate };
}
