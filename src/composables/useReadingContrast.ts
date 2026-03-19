import { watch, nextTick, onBeforeUnmount, type Ref } from 'vue';
import { isOnLightBackground } from '../utils/readingLight';
import { refreshReadingCharColors } from '../utils/readingCharRegistry';

function applySectionTheme(section: HTMLElement, onLight: boolean) {
  if (onLight) {
    section.style.setProperty('--section-heading', '#0c0a09');
    section.style.setProperty('--section-body', '#292524');
    section.style.setProperty('--section-muted', '#44403c');
    section.style.setProperty('--section-subtle', '#57534e');
    section.style.setProperty('--section-link', '#1c1917');
    section.style.setProperty('--section-link-hover', '#0c0a09');
    section.style.setProperty('--section-divider', 'rgba(12, 10, 9, 0.14)');
    section.style.setProperty('--section-chip-bg', 'rgba(28, 25, 23, 0.09)');
    section.style.setProperty('--section-chip-text', '#4b5563');
    section.style.setProperty('--section-progress-track', 'rgba(28, 25, 23, 0.2)');
    section.style.setProperty('--section-progress-track-shade', 'rgba(12, 10, 9, 0.18)');
    section.style.setProperty('--skills-track-border', 'rgba(28, 25, 23, 0.1)');
    section.style.setProperty('--skills-track-highlight', 'rgba(255, 250, 240, 0.07)');
    section.style.setProperty('--skills-ink', '#1c1917');
    section.style.setProperty('--skills-muted', '#57534e');
    section.style.setProperty('--skills-faint', '#78716c');
    section.dataset.reading = 'light';
  } else {
    section.style.setProperty('--section-heading', '#fafaf9');
    section.style.setProperty('--section-body', '#e7e5e4');
    section.style.setProperty('--section-muted', '#d6d3d1');
    section.style.setProperty('--section-subtle', '#a8a29e');
    section.style.setProperty('--section-link', '#fff5e0');
    section.style.setProperty('--section-link-hover', '#ffffff');
    section.style.setProperty('--section-divider', 'rgba(255, 250, 240, 0.16)');
    section.style.setProperty('--section-chip-bg', 'rgba(255, 255, 255, 0.12)');
    section.style.setProperty('--section-chip-text', '#e7e5e4');
    section.style.setProperty('--section-progress-track', 'rgba(255, 250, 240, 0.18)');
    section.style.setProperty('--section-progress-track-shade', 'rgba(0, 0, 0, 0.22)');
    section.style.setProperty('--skills-track-border', 'rgba(255, 250, 240, 0.14)');
    section.style.setProperty('--skills-track-highlight', 'rgba(255, 255, 255, 0.06)');
    section.style.setProperty('--skills-ink', '#fafaf9');
    section.style.setProperty('--skills-muted', '#d6d3d1');
    section.style.setProperty('--skills-faint', '#a8a29e');
    section.dataset.reading = 'dark';
  }
}

export function useReadingContrast(scrollContainerRef: Ref<HTMLElement | null>) {
  let cleanup: (() => void) | undefined;
  let rafId = 0;

  function update() {
    const root = scrollContainerRef.value;
    if (!root) return;

    const sections = root.querySelectorAll<HTMLElement>('.section');
    sections.forEach((section) => {
      const anchor = section.querySelector('.section-content') ?? section;
      const rect = anchor.getBoundingClientRect();
      const px = rect.left + rect.width / 2;
      const py = rect.top + rect.height / 2;
      applySectionTheme(section, isOnLightBackground(px, py));
    });
    refreshReadingCharColors();
  }

  function scheduleUpdate() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      update();
    });
  }

  function setup() {
    const el = scrollContainerRef.value;
    if (!el) return;

    el.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    scheduleUpdate();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      el.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
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
    { immediate: true }
  );

  onBeforeUnmount(() => {
    cleanup?.();
  });
}
