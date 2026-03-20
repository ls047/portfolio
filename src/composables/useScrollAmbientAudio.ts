import { watch, onMounted, onBeforeUnmount, type Ref } from 'vue';

const AMBIENT_SRC = '/audio/freesound_community-inside-car-noise-while-driving-29978.mp3';
const SCROLL_SFX_SRC = '/audio/freesound_community-car-acceleration-drive-by-90069.mp3';

const AMBIENT_BASE_VOL = 0.2;
const AMBIENT_DUCK_VOL = 0.09;
const SCROLL_SFX_MAX_VOL = 0.44;
const VOLUME_SMOOTH = 0.14;
const SCROLL_IDLE_MS = 280;
const DOWN_DELTA_MIN = 0.6;
const UP_DELTA_MIN = 0.6;

/**
 * Looping in-cab ambient + drive-by layered while scrolling down; fades out when scrolling stops.
 */
export function useScrollAmbientAudio(
  scrollRootRef: Ref<HTMLElement | null>,
  resumeWhen: Ref<boolean>
): void {
  let ambient: HTMLAudioElement | null = null;
  let scrollSfx: HTMLAudioElement | null = null;
  let lastScrollTop = 0;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let rafId = 0;
  let detachScroll: (() => void) | null = null;
  let motionReduced = false;

  let ambientTarget = 0;
  let ambientCurrent = 0;
  let scrollTarget = 0;
  let scrollCurrent = 0;

  function stopRaf() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function syncVolumes() {
    if (!ambient || !scrollSfx) return;
    ambientCurrent += (ambientTarget - ambientCurrent) * VOLUME_SMOOTH;
    scrollCurrent += (scrollTarget - scrollCurrent) * VOLUME_SMOOTH;
    ambient.volume = Math.min(1, Math.max(0, ambientCurrent));
    scrollSfx.volume = Math.min(1, Math.max(0, scrollCurrent));

    if (scrollTarget < 0.03 && scrollCurrent < 0.02) {
      scrollSfx.pause();
    } else if (scrollTarget > 0.05 && scrollSfx.paused) {
      void scrollSfx.play().catch(() => {});
    }
  }

  function tick() {
    syncVolumes();
    const busy =
      Math.abs(ambientTarget - ambientCurrent) > 0.01 ||
      Math.abs(scrollTarget - scrollCurrent) > 0.01 ||
      (scrollTarget > 0.06 && scrollCurrent > 0.04);
    if (busy) rafId = requestAnimationFrame(tick);
    else rafId = 0;
  }

  function bumpRaf() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tryResumeAmbient() {
    if (!ambient || motionReduced || !resumeWhen.value) return;
    ambientTarget = AMBIENT_BASE_VOL;
    void ambient.play().catch(() => {});
    bumpRaf();
  }

  function onScroll() {
    const el = scrollRootRef.value;
    if (!el || motionReduced) return;

    tryResumeAmbient();

    const top = el.scrollTop;
    const delta = top - lastScrollTop;
    lastScrollTop = top;

    if (delta > DOWN_DELTA_MIN) {
      scrollTarget = SCROLL_SFX_MAX_VOL;
      ambientTarget = AMBIENT_DUCK_VOL;
      if (scrollSfx && scrollSfx.paused) {
        scrollSfx.currentTime = 0;
        void scrollSfx.play().catch(() => {});
      }
    } else if (delta < -UP_DELTA_MIN) {
      scrollTarget = 0;
      ambientTarget = AMBIENT_BASE_VOL;
    }

    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      scrollTarget = 0;
      ambientTarget = AMBIENT_BASE_VOL;
      idleTimer = null;
      bumpRaf();
    }, SCROLL_IDLE_MS);
    bumpRaf();
  }

  function bindScroll(el: HTMLElement) {
    detachScroll?.();
    lastScrollTop = el.scrollTop;
    el.addEventListener('scroll', onScroll, { passive: true });
    detachScroll = () => {
      el.removeEventListener('scroll', onScroll);
      detachScroll = null;
    };
  }

  function disposeAudios() {
    stopRaf();
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    detachScroll?.();
    if (ambient) {
      ambient.pause();
      ambient.removeAttribute('src');
      ambient.load();
      ambient = null;
    }
    if (scrollSfx) {
      scrollSfx.pause();
      scrollSfx.removeAttribute('src');
      scrollSfx.load();
      scrollSfx = null;
    }
  }

  let stopResumeWatch: (() => void) | null = null;
  let stopScrollWatch: (() => void) | null = null;

  onMounted(() => {
    motionReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    if (motionReduced) return;

    ambient = new Audio(AMBIENT_SRC);
    ambient.loop = true;
    ambient.preload = 'auto';

    scrollSfx = new Audio(SCROLL_SFX_SRC);
    scrollSfx.loop = true;
    scrollSfx.preload = 'auto';

    ambientCurrent = 0;
    ambientTarget = 0;
    scrollCurrent = 0;
    scrollTarget = 0;

    stopResumeWatch = watch(
      resumeWhen,
      (ok) => {
        if (!ambient || !scrollSfx) return;
        if (!ok) {
          ambientTarget = 0;
          scrollTarget = 0;
          ambient.pause();
          scrollSfx.pause();
          bumpRaf();
        } else {
          tryResumeAmbient();
        }
      },
      { immediate: true }
    );

    stopScrollWatch = watch(
      scrollRootRef,
      (el) => {
        detachScroll?.();
        if (el) bindScroll(el);
      },
      { immediate: true }
    );
  });

  onBeforeUnmount(() => {
    stopResumeWatch?.();
    stopResumeWatch = null;
    stopScrollWatch?.();
    stopScrollWatch = null;
    disposeAudios();
  });
}
