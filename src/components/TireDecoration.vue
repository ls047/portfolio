<template>
  <div
    v-show="visible"
    class="tire-decoration"
    :class="{ 'tire-slided-in': slideIn, 'is-dragging': isDragging }"
    aria-hidden="true"
  >
    <div
      ref="tireWrapperRef"
      class="tire-image-wrapper"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <img
        :src="rimTireImage"
        alt=""
        class="tire-image"
        draggable="false"
        :style="{ transform: `rotate(${scrollRotation}deg)` }"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount, inject } from 'vue';
import type { Ref } from 'vue';
import rimTireImage from '@/assets/Polished Buick wheel with chrome detail.png';

const props = defineProps<{
  visible: boolean;
  contentOpacity: number;
}>();

const scrollContainerRef = inject<Ref<HTMLElement | null>>('scrollContainerRef');
const contentRevealed = computed(() => props.contentOpacity >= 1);
const slideIn = ref(false);

// Delay slide-in so browser renders off-screen state first, then animates
watch(
  () => props.visible && contentRevealed.value,
  (shouldSlide) => {
    slideIn.value = false;
    if (!shouldSlide) return;
    const id = setTimeout(() => {
      slideIn.value = true;
    }, 50); // brief delay so initial off-screen state is painted
    return () => clearTimeout(id);
  },
  { immediate: true }
);

const scrollRotation = ref(0);
const isDragging = ref(false);
const tireWrapperRef = ref<HTMLElement | null>(null);
let lastPointerY = 0;
const ROTATIONS_PER_FULL_SCROLL = 2;

function updateRotation() {
  const el = scrollContainerRef?.value;
  if (!el) return;
  const { scrollTop, scrollHeight, clientHeight } = el;
  const maxScroll = scrollHeight - clientHeight;
  if (maxScroll <= 0) {
    scrollRotation.value = 0;
    return;
  }
  const progress = scrollTop / maxScroll;
  scrollRotation.value = -progress * 360 * ROTATIONS_PER_FULL_SCROLL;
}

function attachScroll(el: HTMLElement) {
  el.addEventListener('scroll', updateRotation);
  updateRotation();
}

function detachScroll(el: HTMLElement) {
  el.removeEventListener('scroll', updateRotation);
}

function onPointerDown(e: PointerEvent) {
  if (!scrollContainerRef?.value) return;
  e.preventDefault();
  isDragging.value = true;
  lastPointerY = e.clientY;
  tireWrapperRef.value?.setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || !scrollContainerRef?.value) return;
  const el = scrollContainerRef.value;
  const deltaY = e.clientY - lastPointerY;
  lastPointerY = e.clientY;
  const maxScroll = el.scrollHeight - el.clientHeight;
  if (maxScroll <= 0) return;
  el.scrollTop = Math.max(0, Math.min(maxScroll, el.scrollTop + deltaY));
  updateRotation();
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging.value) return;
  isDragging.value = false;
  try {
    tireWrapperRef.value?.releasePointerCapture(e.pointerId);
  } catch {
    /* no capture */
  }
}

watch(
  [() => scrollContainerRef?.value, () => props.visible],
  async ([el, visible], [prevEl]) => {
    if (prevEl) detachScroll(prevEl);
    if (el && visible) {
      await nextTick();
      attachScroll(el);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  const el = scrollContainerRef?.value;
  if (el) detachScroll(el);
});
</script>

<style scoped>
.tire-decoration {
  position: fixed;
  right: 0;
  top: 0;
  width: min(22vw, 320px);
  height: 100vh;
  overflow: hidden;
  z-index: 50;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transform: translateX(100%); /* start off-screen right */
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.tire-decoration .tire-image-wrapper {
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
}

.tire-decoration .tire-image {
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.tire-decoration.tire-slided-in {
  transform: translateX(0); /* slide in from right to current position */
  transition-delay: 0.8s; /* wait for content fade-in (0.8s) to finish */
}

@media (max-width: 768px) {
  .tire-decoration {
    right: auto;
    left: 50%;
    top: 0;
    width: 100vw;
    height: 50vh;
    transform: translateX(100vw); /* start off-screen right */
    align-items: flex-start;
    justify-content: center;
  }

  .tire-decoration.tire-slided-in {
    transform: translateX(-50%); /* center - final position */
  }

  .tire-image-wrapper {
    transform: translateY(-60%);
    width: 80vw;
    height: 80vw;
    min-width: 80vw;
    min-height: 80vw;
  }
}

.tire-decoration.is-dragging .tire-image-wrapper {
  cursor: grabbing;
}

.tire-image-wrapper {
  width: 200%;
  height: 200%;
  min-width: 44vw;
  min-height: 44vw;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tire-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.05s linear;
}
</style>
