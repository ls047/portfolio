<template>
  <div
    ref="rootRef"
    class="section-reveal min-w-0 w-full"
    :data-section-visible="revealed"
    :style="cardStyle"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onBeforeUnmount,
  nextTick,
  inject,
} from 'vue';
import type { Ref } from 'vue';

/** Scroll container from layout (`content-overlay.content-scroll`). */
const scrollContainerRef = inject<Ref<HTMLElement | null> | undefined>('scrollContainerRef');

const rootRef = ref<HTMLElement | null>(null);
/** Latched: hidden until the user scrolls far enough in, then stays visible. */
const revealed = ref(false);

let observer: IntersectionObserver | null = null;

/** Need ~this much of the section visible before revealing (0–1). */
const REVEAL_AT = 0.12;

const cardStyle = computed(() => ({
  opacity: revealed.value ? 1 : 0,
  transform: revealed.value ? 'translateY(0)' : 'translateY(1.25rem)',
  pointerEvents: (revealed.value ? 'auto' : 'none') as 'auto' | 'none',
}));

function disconnect() {
  observer?.disconnect();
  observer = null;
}

function connect() {
  disconnect();
  const el = rootRef.value;
  const root = scrollContainerRef?.value ?? null;
  if (!el) return;

  observer = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (!e) return;
      if (e.intersectionRatio >= REVEAL_AT) {
        revealed.value = true;
      }
    },
    {
      root,
      rootMargin: '0px',
      threshold: [0, 0.06, REVEAL_AT, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95, 1],
    }
  );
  observer.observe(el);
}

watch(
  () => [scrollContainerRef?.value, rootRef.value] as const,
  async () => {
    await nextTick();
    connect();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  disconnect();
});
</script>

<style scoped>
.section-reveal {
  transition:
    opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
