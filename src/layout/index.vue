<template>
  <div class="layout-container">
    <!-- 3D Canvas - car intro (from useCarIntro) -->
    <div
      ref="canvasContainer"
      class="fixed inset-0 z-0 w-full h-full"
    />

    <!-- Page content - revealed after car intro -->
    <div
      ref="contentOverlayRef"
      class="content-overlay content-scroll relative z-10"
      :style="lightStyle"
    >
      <slot />
    </div>

    <!-- Above scroll layer so grab cursor + drag work (full-width overlay was blocking hits) -->
    <TireDecoration
      :visible="tireVisible"
      :content-opacity="contentOpacity"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, provide, watch, computed } from 'vue';
import { useCarIntro } from '../composables/useCarIntro';
import { useReadingContrast } from '../composables/useReadingContrast';
import TireDecoration from '../components/TireDecoration.vue';

const canvasContainer = ref<HTMLElement | null>(null);
const contentOverlayRef = ref<HTMLElement | null>(null);
provide('scrollContainerRef', contentOverlayRef);

const { contentOpacity } = useCarIntro(canvasContainer);
useReadingContrast(contentOverlayRef);

const lightStyle = computed(() => ({
  opacity: contentOpacity.value,
}));
const tireVisible = ref(false);

watch(contentOpacity, (opacity) => {
  if (opacity >= 1) {
    const t = setTimeout(() => {
      tireVisible.value = true;
    }, 800);
    return () => {
      clearTimeout(t);
      tireVisible.value = false;
    };
  }
  tireVisible.value = false;
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
  /* Left mirror of .tire-decoration (desktop: mid-height; mobile: ~tire top band) */
  --reading-light-x: min(11vw, 160px);
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
  background-attachment: fixed;
  background-position: center;
  transition: opacity 0.8s ease-out;
}

@media (max-width: 768px) {
  .content-overlay {
    --reading-light-y: 20%;
  }
}

.content-overlay.content-scroll {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.content-overlay.content-scroll::-webkit-scrollbar {
  display: none;
}

/* Text on radial: black in the glow, white in the vignette — vars from .section */
.content-overlay :deep(.reading-head) {
  color: var(--section-heading) !important;
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
  border-color: var(--section-divider) !important;
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

/* Per-word ink from `syncReadingVisualInks` */
.content-overlay :deep(.reading-word) {
  color: var(--reading-ink-sync, #000000) !important;
  -webkit-text-fill-color: var(--reading-ink-sync, #000000) !important;
  caret-color: var(--reading-ink-sync, #000000);
  transition: none !important;
}
</style>
