<template>
  <div class="layout-container">
    <!-- 3D Canvas - car intro (from useCarIntro) -->
    <div
      ref="canvasContainer"
      class="fixed inset-0 z-0 w-full h-full"
    />

    <!-- Page content (radial backdrop); section bodies use SectionReveal genie -->
    <div
      ref="contentOverlayRef"
      class="content-overlay content-scroll relative z-10"
      :style="contentOverlayOpacityStyle"
    >
      <slot />
    </div>

    <IntroNarrativeOverlay
      :phase="introPhase"
      :drift-progress="driftProgress"
      :boot-lines-revealed="bootLinesRevealed"
    />

    <SecurityCameraOverlay />

  </div>

  <!-- Sibling of layout-container: not clipped by its overflow:hidden; WebGL can bleed left -->
  <CameraDecoration :visible="cameraRailVisible" />
</template>

<script setup lang="ts">
import { ref, provide, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useCarIntro } from '../composables/useCarIntro';
import { useReadingContrast } from '../composables/useReadingContrast';
import { useScrollBackgroundAudio } from '../composables/useScrollBackgroundAudio';
import { getLightCenterPx } from '../utils/readingLight';
import {
  readingLightSweepPhase,
  READING_LIGHT_SWEEP_SPEED_RAD_S,
} from '../utils/readingLightSweep';
import CameraDecoration from '../components/CameraDecoration.vue';
import IntroNarrativeOverlay from '../components/IntroNarrativeOverlay.vue';
import SecurityCameraOverlay from '../components/SecurityCameraOverlay.vue';
const canvasContainer = ref<HTMLElement | null>(null);
const contentOverlayRef = ref<HTMLElement | null>(null);

const { contentOpacity, introPhase, driftProgress, bootLinesRevealed } = useCarIntro(canvasContainer);
const { forceReadingUpdate } = useReadingContrast(contentOverlayRef);
const contentReadyForAudio = computed(() => contentOpacity.value >= 1);
useScrollBackgroundAudio(contentOverlayRef, { ready: contentReadyForAudio });

/** Full section theme + per-word ink (scroll does this; ink-only pokes miss theme + wrong rects mid-animation). */
function pokeReadingVisualSync() {
  forceReadingUpdate();
}

provide('scrollContainerRef', contentOverlayRef);
provide('pokeReadingVisualSync', pokeReadingVisualSync);

/**
 * Opacity only — reactive. Spotlight `--reading-light-*` is written imperatively in the sweep loop
 * so Vue does not re-run a computed ~60fps (that was forcing layout + style churn and scroll jank).
 */
const contentOverlayOpacityStyle = computed(() => ({
  opacity: contentOpacity.value,
}));

function paintReadingLightCssVars() {
  const el = contentOverlayRef.value;
  if (!el || typeof window === 'undefined') return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const { x, y } = getLightCenterPx(w, h);
  el.style.setProperty('--reading-light-x', `${x}px`);
  el.style.setProperty('--reading-light-y', `${y}px`);
}

const readingLightSweepEnabled = computed(() => contentOpacity.value >= 1);

let readingSweepRaf = 0;
let readingSweepLastT = 0;
let readingSweepLastInkPoke = 0;

function readingLightSweepFrame(time: number) {
  readingSweepRaf = requestAnimationFrame(readingLightSweepFrame);
  if (!readingLightSweepEnabled.value) {
    readingSweepLastT = 0;
    return;
  }
  paintReadingLightCssVars();

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    if (time - readingSweepLastInkPoke >= 480) {
      readingSweepLastInkPoke = time;
      forceReadingUpdate();
    }
    return;
  }

  if (readingSweepLastT === 0) readingSweepLastT = time;
  const dt = Math.min(0.05, (time - readingSweepLastT) / 1000);
  readingSweepLastT = time;
  readingLightSweepPhase.value += READING_LIGHT_SWEEP_SPEED_RAD_S * dt;

  const inkInterval =
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 380 : 280;
  if (time - readingSweepLastInkPoke >= inkInterval) {
    readingSweepLastInkPoke = time;
    forceReadingUpdate();
  }
}

function onWindowResizeForLight() {
  if (contentOpacity.value >= 1) paintReadingLightCssVars();
}

onMounted(() => {
  readingSweepRaf = requestAnimationFrame(readingLightSweepFrame);
  window.addEventListener('resize', onWindowResizeForLight, { passive: true });
});

onBeforeUnmount(() => {
  cancelAnimationFrame(readingSweepRaf);
  window.removeEventListener('resize', onWindowResizeForLight);
});

const cameraRailVisible = ref(false);

watch(contentOpacity, (opacity) => {
  if (opacity >= 1) {
    void nextTick(() => {
      requestAnimationFrame(() => {
        paintReadingLightCssVars();
        forceReadingUpdate();
      });
    });
    cameraRailVisible.value = true;
  } else {
    cameraRailVisible.value = false;
  }
}, { immediate: true });
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  overflow: hidden;
  position: relative;
}

.content-overlay {
  min-height: 100vh;
  overflow: hidden;
  transition: opacity 0.8s ease-out;
  /* Defaults until useReadingContrast sets per-section vars (black / white only) */
  --section-heading: #000000;
  --section-body: #000000;
  --section-muted: #000000;
  --section-subtle: #000000;
  --section-link: #000000;
  --section-link-hover: #000000;
  --section-divider: rgba(0, 0, 0, 0.14);
  --section-chip-bg: rgba(0, 0, 0, 0.08);
  --section-chip-text: #000000;
  /* Desktop: left mirror of right camera strip — sync with readingLight.getLightCenterPx */
  --reading-light-x: min(13vw, 185px);
  --reading-light-y: 50%;
  /* White spotlight → black vignette; neutral mid grays only */
  background: radial-gradient(
    circle at var(--reading-light-x) var(--reading-light-y),
    #ffffff 0%,
    #ffffff 10%,
    #c8c8c8 19%,
    #2a2a2a 33%,
    #000000 44%,
    #000000 100%
  );
  /* `fixed` repaints against the viewport every scroll tick → jank + fuzzy text on many GPUs.
   * `scroll` keeps the fill pinned to this scrollport (content still rolls over the radial). */
  background-attachment: scroll;
  background-position: center;
}

@media (max-width: 1023px) {
  .content-overlay {
    /* Phones & tablets: glow low & near horizontal center; CCTV sits top-left */
    --reading-light-x: 50%;
    --reading-light-y: 86%;
  }
}

.content-overlay.content-scroll {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* Own layer: scroll + backdrop don’t pull the whole page into repaint as often */
  isolation: isolate;
}

.content-overlay.content-scroll::-webkit-scrollbar {
  display: none;
}

/* Easing for section-driven colors (theme flip while scrolling) */
.content-overlay :deep(.reading-head),
.content-overlay :deep(.reading-body),
.content-overlay :deep(.reading-muted),
.content-overlay :deep(.reading-subtle),
.content-overlay :deep(.reading-link) {
  transition: color 0.55s cubic-bezier(0.22, 1, 0.36, 1) !important;
}
.content-overlay :deep(.reading-link:hover) {
  transition: color 0.35s cubic-bezier(0.22, 1, 0.36, 1) !important;
}
.content-overlay :deep(.reading-border) {
  transition:
    border-color 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.55s cubic-bezier(0.22, 1, 0.36, 1) !important;
}
.content-overlay :deep(.reading-chip) {
  transition:
    background-color 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    color 0.55s cubic-bezier(0.22, 1, 0.36, 1) !important;
}

/* Text on radial: black in the glow, white in the vignette — vars from .section */
.content-overlay :deep(.reading-head) {
  color: var(--section-heading) !important;
  font-family: var(--font-display), var(--font-secondary), system-ui, sans-serif !important;
  letter-spacing: 0.04em;
}
.content-overlay :deep(.reading-body) {
  color: var(--section-body) !important;
}
.content-overlay :deep(.reading-muted) {
  color: var(--section-muted) !important;
}
.content-overlay :deep(.reading-subtle) {
  color: var(--section-subtle) !important;
}
.content-overlay :deep(.reading-link) {
  color: var(--section-link) !important;
}
.content-overlay :deep(.reading-link:hover) {
  color: var(--section-link-hover) !important;
}
.content-overlay :deep(.reading-border) {
  border-color: var(--reading-border-sync, var(--section-divider)) !important;
}
.content-overlay :deep(.reading-chip) {
  background-color: var(--section-chip-bg) !important;
  color: var(--section-chip-text) !important;
}

.content-overlay :deep(.reading-chars-visual) {
  white-space: pre-line;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Per-word ink — text-fill + caret (don’t apply text-fill on Iconify mask nodes; breaks currentColor). */
.content-overlay :deep(.reading-word) {
  color: var(--reading-ink-sync, #000000) !important;
  -webkit-text-fill-color: var(--reading-ink-sync, #000000) !important;
  caret-color: var(--reading-ink-sync, #000000);
  transition-property: color, -webkit-text-fill-color, caret-color !important;
  transition-duration: 0.16s !important;
  transition-timing-function: cubic-bezier(0.25, 0.9, 0.35, 1) !important;
}

/*
 * Put `.reading-icon` on a plain wrapper (no Vue :style) — AppIcon’s bound `fontSize` was clearing
 * `--reading-ink-sync` from the same node on re-renders. Child uses Iconify mask → `currentColor` only.
 */
.content-overlay :deep(.reading-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--reading-ink-sync, #000000) !important;
  transition-property: color !important;
  transition-duration: 0.16s !important;
  transition-timing-function: cubic-bezier(0.25, 0.9, 0.35, 1) !important;
}

.content-overlay :deep(.reading-icon > *) {
  color: inherit !important;
}

@media (prefers-reduced-motion: reduce) {
  .content-overlay :deep(.reading-head),
  .content-overlay :deep(.reading-body),
  .content-overlay :deep(.reading-muted),
  .content-overlay :deep(.reading-subtle),
  .content-overlay :deep(.reading-link),
  .content-overlay :deep(.reading-border),
  .content-overlay :deep(.reading-icon),
  .content-overlay :deep(.reading-chip),
  .content-overlay :deep(.reading-word) {
    transition-duration: 0.01ms !important;
  }
}

/* Narrow viewports: longer ink blend so grays track the bottom glow without stepping */
@media (max-width: 1023px) {
  .content-overlay :deep(.reading-head),
  .content-overlay :deep(.reading-body),
  .content-overlay :deep(.reading-muted),
  .content-overlay :deep(.reading-subtle),
  .content-overlay :deep(.reading-link) {
    transition-duration: 0.42s !important;
    transition-timing-function: cubic-bezier(0.25, 0.85, 0.4, 1) !important;
  }

  .content-overlay :deep(.reading-word),
  .content-overlay :deep(.reading-icon) {
    transition-duration: 0.32s !important;
    transition-timing-function: cubic-bezier(0.28, 0.88, 0.42, 1) !important;
  }
}
</style>
