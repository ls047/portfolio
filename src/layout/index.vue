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
import { useScrollAmbientAudio } from '../composables/useScrollAmbientAudio';
import TireDecoration from '../components/TireDecoration.vue';

const canvasContainer = ref<HTMLElement | null>(null);
const contentOverlayRef = ref<HTMLElement | null>(null);

const { contentOpacity } = useCarIntro(canvasContainer);

const contentRevealed = computed(() => contentOpacity.value >= 1);
useScrollAmbientAudio(contentOverlayRef, contentRevealed);

provide('scrollContainerRef', contentOverlayRef);

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
  transition: opacity 0.8s ease-out;
  /* Large centered wash — most of the viewport cream; vignette in corners only */
  --reading-light-x: 50%;
  --reading-light-y: 48%;
  background: radial-gradient(
    ellipse 118% 112% at var(--reading-light-x) var(--reading-light-y),
    #f7efde 0%,
    #f2e8d6 32%,
    #dfd0c0 52%,
    #8a7d6f 74%,
    #241f1c 90%,
    #000000 100%
  );
  background-attachment: fixed;
  background-position: center;
}

@media (max-width: 1023px) {
  .content-overlay {
    /* Same center; attachment follows scroll on compact viewports */
    background-attachment: scroll;
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

/* Portfolio copy: static theme colors (no scroll / spotlight ink). */
.content-overlay :deep(.reading-head) {
  color: var(--color-text) !important;
}
.content-overlay :deep(.reading-body) {
  color: var(--color-text) !important;
}
.content-overlay :deep(.reading-muted) {
  color: var(--color-text-secondary) !important;
}
.content-overlay :deep(.reading-subtle) {
  color: var(--color-text-secondary) !important;
}
.content-overlay :deep(.reading-link) {
  color: var(--color-link) !important;
}
.content-overlay :deep(.reading-link:hover) {
  color: var(--color-link-hover) !important;
}
.content-overlay :deep(.reading-border) {
  border-color: var(--color-border) !important;
}
.content-overlay :deep(.reading-chip) {
  background-color: var(--color-muted) !important;
  color: var(--color-text) !important;
}

.content-overlay :deep(.reading-chars-visual) {
  white-space: pre-line;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.content-overlay :deep(.reading-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text) !important;
}

.content-overlay :deep(.reading-icon > *) {
  color: inherit !important;
}
</style>
