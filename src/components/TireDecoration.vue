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
    return () => {
      clearTimeout(id);
    };
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
/* ─── Desktop / tablet: right vertical strip (slide in from right) ─── */
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
  transform: translateX(100%);
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
  transform: translateX(0);
  transition-delay: 0.8s;
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

/* ─── Mobile only: bottom-centered band (slide up); wheel sits lower in the viewport ─── */
@media (max-width: 768px) {
  .tire-decoration {
    left: 0;
    right: 0;
    top: auto;
    bottom: 0;
    width: 100%;
    height: min(40vh, 320px);
    align-items: flex-end;
    justify-content: center;
    transform: translateY(100%);
  }

  .tire-decoration.tire-slided-in {
    transform: translateY(0);
  }

  .tire-image-wrapper {
    width: min(88vw, 400px);
    height: min(88vw, 400px);
    min-width: min(88vw, 400px);
    min-height: min(88vw, 400px);
    /* Push wheel further down — mostly below the fold */
    transform: translateY(64%);
  }
}
</style>
