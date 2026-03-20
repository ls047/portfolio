import { watch, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { siteSoundMuted } from './siteSound';

const AMBIENT_SRC = '/audio/freesound_community-inside-car-noise-while-driving-29978.mp3';
const SCROLL_SFX_SRC = '/audio/freesound_community-car-acceleration-drive-by-90069.mp3';

const AMBIENT_VOL = 0.38;
const SCROLL_SFX_PEAK = 0.5;
/** No scroll events for this long → fade acceleration out */
const SCROLL_IDLE_MS = 220;
/** Per-frame smoothing (higher = faster) */
const SMOOTH = 0.12;
const SCROLL_DOWN_MIN_DELTA = 0.8;

interface Options {
  /** e.g. intro finished — avoids music under loading screen */
  ready: Ref<boolean>;
}

export function useScrollBackgroundAudio(scrollRef: Ref<HTMLElement | null>, options: Options) {
  const { ready } = options;

  let ambient: HTMLAudioElement | null = null;
  let scrollSfx: HTMLAudioElement | null = null;
  let rafId = 0;
  let lastScrollTop = 0;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let ambientVolTarget = 0;
  let scrollSfxVolTarget = 0;
  let unlocked = false;
  let disposed = false;

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureAmbient() {
    if (ambient) return;
    ambient = new Audio(AMBIENT_SRC);
    ambient.loop = true;
    ambient.preload = 'auto';
    ambient.volume = 0;
  }

  /** Second looping stream — only create after user scrolls (saves decode + buffer RAM at idle). */
  function ensureScrollSfx() {
    if (scrollSfx) return;
    scrollSfx = new Audio(SCROLL_SFX_SRC);
    scrollSfx.loop = true;
    scrollSfx.preload = 'auto';
    scrollSfx.volume = 0;
  }

  function initElements() {
    ensureAmbient();
  }

  function tearDownElements() {
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

  function stopRaf() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function tick() {
    if (disposed) return;
    rafId = requestAnimationFrame(tick);

    if (ambient) {
      const d = ambientVolTarget - ambient.volume;
      ambient.volume += d * SMOOTH;
      if (Math.abs(d) < 0.002) ambient.volume = ambientVolTarget;
    }

    if (scrollSfx) {
      const d = scrollSfxVolTarget - scrollSfx.volume;
      scrollSfx.volume += d * SMOOTH;
      if (Math.abs(d) < 0.002) scrollSfx.volume = scrollSfxVolTarget;

      if (scrollSfxVolTarget > 0.04 && scrollSfx.paused) {
        scrollSfx.currentTime = 0;
        void scrollSfx.play().catch(() => {});
      }
      if (scrollSfxVolTarget < 0.03 && scrollSfx.volume < 0.04) {
        scrollSfx.pause();
        scrollSfx.currentTime = 0;
      }
    }
  }

  function scheduleScrollIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      scrollSfxVolTarget = 0;
      idleTimer = null;
    }, SCROLL_IDLE_MS);
  }

  function unlock() {
    if (unlocked || reduceMotion || disposed) return;
    unlocked = true;
    initElements();
    if (ready.value && !siteSoundMuted.value) {
      ambientVolTarget = AMBIENT_VOL;
      void ambient?.play().catch(() => {});
    }
    if (!rafId) tick();
  }

  function onScroll() {
    if (disposed || reduceMotion) return;

    const el = scrollRef.value;
    if (!el) return;

    if (!unlocked) unlock();

    const top = el.scrollTop;
    const delta = top - lastScrollTop;
    lastScrollTop = top;

    if (siteSoundMuted.value) return;

    if (delta > SCROLL_DOWN_MIN_DELTA) {
      ensureScrollSfx();
      scrollSfxVolTarget = SCROLL_SFX_PEAK;
      scheduleScrollIdle();
    } else if (delta < -SCROLL_DOWN_MIN_DELTA) {
      scrollSfxVolTarget = 0;
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    }
  }

  function onVisibility() {
    if (disposed || reduceMotion) return;
    if (typeof document !== 'undefined' && document.hidden) {
      ambient?.pause();
      scrollSfx?.pause();
    } else if (unlocked && ready.value && ambient && !siteSoundMuted.value) {
      void ambient.play().catch(() => {});
    }
  }

  watch(ready, (isReady) => {
    if (reduceMotion || disposed) return;
    if (isReady && unlocked && !siteSoundMuted.value) {
      initElements();
      ambientVolTarget = AMBIENT_VOL;
      void ambient?.play().catch(() => {});
      if (!rafId) tick();
    } else if (!isReady) {
      ambientVolTarget = 0;
    } else if (isReady && unlocked && siteSoundMuted.value) {
      ambientVolTarget = 0;
      scrollSfxVolTarget = 0;
      ambient?.pause();
      scrollSfx?.pause();
    }
  });

  watch(siteSoundMuted, (muted) => {
    if (reduceMotion || disposed) return;
    if (muted) {
      ambientVolTarget = 0;
      scrollSfxVolTarget = 0;
      ambient?.pause();
      scrollSfx?.pause();
    } else if (unlocked && ready.value) {
      initElements();
      ambientVolTarget = AMBIENT_VOL;
      void ambient?.play().catch(() => {});
      if (!rafId) tick();
    }
  });

  watch(
    scrollRef,
    (el, prev) => {
      prev?.removeEventListener('scroll', onScroll);
      if (el) {
        lastScrollTop = el.scrollTop;
        el.addEventListener('scroll', onScroll, { passive: true });
      }
    },
    { immediate: true }
  );

  onMounted(() => {
    if (reduceMotion) return;
    const once = () => unlock();
    window.addEventListener('pointerdown', once, { once: true, passive: true });
    window.addEventListener('keydown', once, { once: true, passive: true });
  });

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }

  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
    disposed = true;
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = null;
    scrollRef.value?.removeEventListener('scroll', onScroll);
    stopRaf();
    tearDownElements();
  });
}
