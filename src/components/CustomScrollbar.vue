<template>
  <div
    v-show="visible"
    class="custom-scrollbar"
    :style="{ opacity: contentOpacity }"
    role="scrollbar"
    :aria-valuenow="scrollPercent"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="Scroll position"
  >
    <div
      ref="trackRef"
      class="scrollbar-track"
      @click="onTrackClick"
      @wheel.prevent="onTrackWheel"
    >
      <div
        ref="thumbRef"
        class="scrollbar-thumb"
        :class="{ 'is-dragging': isDragging }"
        :style="{ top: thumbTopStyle }"
        role="slider"
        tabindex="0"
        :aria-valuenow="scrollPercent"
        @pointerdown="onThumbPointerDown"
        @keydown="onThumbKeydown"
      >
        <div
          ref="carContainerRef"
          class="car-3d-wrapper"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useScrollbarCar } from '../composables/useScrollbarCar';

const props = defineProps<{
  scrollContainerRef: { value: HTMLElement | null };
  visible: boolean;
  contentOpacity: number;
}>();

const trackRef = ref<HTMLElement | null>(null);
const thumbRef = ref<HTMLElement | null>(null);
const carContainerRef = ref<HTMLElement | null>(null);

useScrollbarCar(carContainerRef);

const scrollPercent = ref(0);
const thumbTopStyle = computed(() => {
  const p = Math.max(0, Math.min(100, scrollPercent.value));
  const thumbH = 64; // match .scrollbar-thumb height
  return `calc(${p}% - ${thumbH / 2}px)`;
});

const isDragging = ref(false);
let dragStartY = 0;
let dragStartScrollTop = 0;

function updateFromScroll() {
  const el = props.scrollContainerRef?.value;
  if (!el) return;
  const { scrollTop, scrollHeight, clientHeight } = el;
  const maxScroll = scrollHeight - clientHeight;
  if (maxScroll <= 0) {
    scrollPercent.value = 0;
    return;
  }
  scrollPercent.value = (scrollTop / maxScroll) * 100;
}

function onThumbPointerDown(e: PointerEvent) {
  if (!trackRef.value || !props.scrollContainerRef?.value) return;
  isDragging.value = true;
  dragStartY = e.clientY;
  dragStartScrollTop = props.scrollContainerRef.value.scrollTop;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'grabbing';
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || !trackRef.value || !props.scrollContainerRef?.value) return;
  const el = props.scrollContainerRef.value;
  const rect = trackRef.value.getBoundingClientRect();
  const trackH = rect.height;
  const thumbH = 64;
  const deltaY = e.clientY - dragStartY;
  const maxScroll = el.scrollHeight - el.clientHeight;
  if (maxScroll <= 0) return;
  const scrollRatio = deltaY / (trackH - thumbH);
  const newScroll = dragStartScrollTop + scrollRatio * maxScroll;
  el.scrollTop = Math.max(0, Math.min(maxScroll, newScroll));
  updateFromScroll();
}

function onPointerUp() {
  if (!isDragging.value) return;
  isDragging.value = false;
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  thumbRef.value?.releasePointerCapture?.(-1);
}

function onTrackWheel(e: WheelEvent) {
  const el = props.scrollContainerRef?.value;
  if (!el) return;
  const maxScroll = el.scrollHeight - el.clientHeight;
  if (maxScroll <= 0) return;
  el.scrollTop = Math.max(0, Math.min(maxScroll, el.scrollTop + e.deltaY));
  updateFromScroll();
}

function onTrackClick(e: MouseEvent) {
  if (!trackRef.value || !props.scrollContainerRef?.value) return;
  const el = props.scrollContainerRef.value;
  const rect = trackRef.value.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const trackH = rect.height;
  const thumbH = 64;
  const maxScroll = el.scrollHeight - el.clientHeight;
  if (maxScroll <= 0) return;
  const ratio = Math.max(0, Math.min(1, (y - thumbH / 2) / (trackH - thumbH)));
  el.scrollTop = ratio * maxScroll;
  updateFromScroll();
}

function onThumbKeydown(e: KeyboardEvent) {
  const el = props.scrollContainerRef?.value;
  if (!el) return;
  const step = 80;
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    el.scrollTop = Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + step);
    updateFromScroll();
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    el.scrollTop = Math.max(0, el.scrollTop - step);
    updateFromScroll();
  }
}

function attachListeners(el: HTMLElement) {
  el.addEventListener('scroll', updateFromScroll);
  updateFromScroll();
}

function detachListeners(el: HTMLElement) {
  el.removeEventListener('scroll', updateFromScroll);
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
});

onBeforeUnmount(() => {
  const el = props.scrollContainerRef?.value;
  if (el) detachListeners(el);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);
});

watch(
  () => props.scrollContainerRef?.value,
  (el, prev) => {
    if (prev) detachListeners(prev);
    if (el) attachListeners(el);
  },
  { immediate: true }
);
</script>

<style scoped>
.custom-scrollbar {
  position: fixed;
  left: 12px;
  top: 0;
  bottom: 0;
  z-index: 40;
  pointer-events: auto;
  transition: opacity 0.8s ease-out;
}

.scrollbar-track {
  position: absolute;
  left: 0;
  top: 24px;
  bottom: 24px;
  width: 56px;
  background: #1a1a1a; /* asphalt / dark road */
  cursor: pointer;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.4);
}

.scrollbar-track::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 6px;
  transform: translateX(-50%);
  /* dashed white center line - street lane markings */
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 12px,
    #ffffff 12px,
    #ffffff 22px
  );
  pointer-events: none;
}

.scrollbar-track:hover {
  background: #222222;
}

.scrollbar-thumb {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 52px;
  height: 64px;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: top 0.05s linear;
  background: transparent;
  border: none;
}

.scrollbar-thumb:hover,
.scrollbar-thumb:active,
.scrollbar-thumb:focus-visible {
  cursor: grabbing;
}

.car-3d-wrapper {
  width: 48px;
  height: 64px;
  border-radius: 4px;
  overflow: hidden;
  background: transparent;
  pointer-events: none; /* thumb receives drag; car is purely visual */
}

.scrollbar-thumb.is-dragging {
  cursor: grabbing;
}
</style>
