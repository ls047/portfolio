<template>
  <div ref="ioTargetRef" class="section-reveal-host min-w-0 w-full">
    <div
      class="section-reveal min-w-0 w-full"
      :class="revealClasses"
      :data-section-visible="dataSectionVisible"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick, inject } from 'vue';
import type { Ref } from 'vue';

const scrollContainerRef = inject<Ref<HTMLElement | null> | undefined>('scrollContainerRef');

const ioTargetRef = ref<HTMLElement | null>(null);
/** Section is “open” in the scroll viewport (door visible). */
const open = ref(false);
/** After first IntersectionObserver callback — avoids playing retract on initial off-screen mount. */
const ioReady = ref(false);
/** Has ever been open — retract only runs after user saw the section at least once. */
const everOpened = ref(false);

let observer: IntersectionObserver | null = null;

function disconnect() {
  observer?.disconnect();
  observer = null;
}

/** Enter vs leave hysteresis (ratio of layout box inside scrollport). */
const IO_ENTER = 0.065;
const IO_LEAVE = 0.028;

function computeOpen(entry: IntersectionObserverEntry, wasOpen: boolean): boolean {
  if (!entry.isIntersecting) return false;
  if (wasOpen) return entry.intersectionRatio > IO_LEAVE;
  return entry.intersectionRatio >= IO_ENTER;
}

function connect() {
  disconnect();
  const el = ioTargetRef.value;
  const root = scrollContainerRef?.value ?? null;
  if (!el) return;

  observer = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (!e) return;

      const next = computeOpen(e, open.value);

      if (!ioReady.value) {
        ioReady.value = true;
        open.value = next;
        if (next) everOpened.value = true;
        return;
      }

      if (next === open.value) return;
      open.value = next;
      if (next) everOpened.value = true;
    },
    {
      root,
      rootMargin: '-6% 0px -8% 0px',
      threshold: [0, 0.02, 0.04, 0.06, 0.1, 0.15, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
    },
  );
  observer.observe(el);
}

const revealClasses = computed(() => {
  if (!ioReady.value) return {};
  if (open.value) return { 'section-reveal--open': true };
  if (everOpened.value) return { 'section-reveal--closed': true };
  return {};
});

const dataSectionVisible = computed(() => ioReady.value && open.value);

watch(
  () => [scrollContainerRef?.value, ioTargetRef.value] as const,
  async () => {
    await nextTick();
    connect();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  disconnect();
});
</script>

<style scoped>
.section-reveal-host {
  overflow: visible;
}

/* Resting “behind tire” — no motion class yet, or after retract completes (forwards). */
.section-reveal {
  opacity: 0;
  pointer-events: none;
  transform-style: preserve-3d;
  transform-origin: calc(100% + min(10vw, 148px)) 50%;
  transform:
    perspective(1100px)
    translate3d(min(4vw, 38px), 0, -980px)
    rotateY(26deg)
    scale3d(0.1, 0.1, 1);
  filter: blur(14px) brightness(0.62) saturate(0.9);
}

.section-reveal--open {
  pointer-events: auto;
  animation: tire-emerge-desktop 1.48s forwards;
}

.section-reveal--closed {
  pointer-events: none;
  animation: tire-retract-desktop 1.22s forwards;
}

/* Phones & tablets: 2D only — no perspective, blur, or huge Z (those tank compositing on smaller GPUs). */
@media (max-width: 1023px) {
  .section-reveal {
    transform-style: flat;
    transform-origin: 50% 50%;
    transform: translate3d(0, 1.125rem, 0) scale(0.93);
    filter: none;
  }

  .section-reveal--open {
    animation: sheet-emerge-mobile 0.88s cubic-bezier(0.22, 1, 0.32, 1) forwards;
  }

  .section-reveal--closed {
    animation: sheet-retract-mobile 0.62s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
}

/* Door opens: slip from behind tire at 0.1 → then grow in view */
@keyframes tire-emerge-desktop {
  0% {
    opacity: 0;
    filter: blur(14px) brightness(0.62);
    transform:
      perspective(1100px)
      translate3d(min(4vw, 38px), 0, -980px)
      rotateY(26deg)
      scale3d(0.1, 0.1, 1);
    animation-timing-function: cubic-bezier(0.22, 1, 0.38, 1);
  }
  12% {
    opacity: 1;
  }
  40% {
    opacity: 1;
    filter: blur(4px) brightness(0.9);
    transform:
      perspective(1100px)
      translate3d(0, 0, 0)
      rotateY(0deg)
      scale3d(0.1, 0.1, 1);
    animation-timing-function: cubic-bezier(0.18, 0.92, 0.22, 1);
  }
  100% {
    opacity: 1;
    filter: none;
    transform:
      perspective(1100px)
      translate3d(0, 0, 0)
      rotateY(0deg)
      scale3d(1, 1, 1);
  }
}

/* Mobile emerge / retract: translateY + scale + opacity only (smooth on low-end GPUs). */
@keyframes sheet-emerge-mobile {
  from {
    opacity: 0;
    transform: translate3d(0, 1.125rem, 0) scale(0.93);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes sheet-retract-mobile {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    opacity: 0;
    transform: translate3d(0, 0.875rem, 0) scale(0.93);
  }
}

/* Door closes: shrink in place, then tuck behind tire */
@keyframes tire-retract-desktop {
  0% {
    opacity: 1;
    filter: none;
    transform:
      perspective(1100px)
      translate3d(0, 0, 0)
      rotateY(0deg)
      scale3d(1, 1, 1);
    animation-timing-function: cubic-bezier(0.28, 0.1, 0.29, 1);
  }
  42% {
    opacity: 1;
    filter: blur(4px) brightness(0.9);
    transform:
      perspective(1100px)
      translate3d(0, 0, 0)
      rotateY(0deg)
      scale3d(0.1, 0.1, 1);
    animation-timing-function: cubic-bezier(0.22, 1, 0.38, 1);
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    filter: blur(14px) brightness(0.62);
    transform:
      perspective(1100px)
      translate3d(min(4vw, 38px), 0, -980px)
      rotateY(26deg)
      scale3d(0.1, 0.1, 1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-reveal {
    transform: scale3d(0.1, 0.1, 1);
    filter: none;
    transition:
      opacity 0.4s ease,
      transform 0.45s ease;
  }

  .section-reveal--open {
    animation: none;
    opacity: 1;
    pointer-events: auto;
    transform: scale3d(1, 1, 1);
  }

  .section-reveal--closed {
    animation: none;
    opacity: 0;
    pointer-events: none;
    transform: scale3d(0.1, 0.1, 1);
  }
}
</style>
