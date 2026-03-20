<template>
  <div
    v-if="visible"
    class="intro-narrative pointer-events-none fixed inset-0 z-[25] flex flex-col justify-end overflow-hidden"
    aria-hidden="true"
  >
    <!-- Drift: “smoke → code” — bottom weight, low contrast so 3D stays hero -->
    <div
      class="intro-narrative-drift max-w-[min(92vw,28rem)] px-[clamp(0.75rem,4vw,1.25rem)] pb-[clamp(1rem,8vh,3rem)] max-md:pb-[max(5rem,min(28vh,12rem))]"
      :style="driftStyle"
    >
      <p class="intro-narrative-code m-0 text-[clamp(0.65rem,1.9vw,0.8rem)] leading-relaxed tracking-wide">
        <span class="block whitespace-pre-wrap">{{ driftSnippetA }}</span>
        <span class="mt-1 block whitespace-pre-wrap opacity-90">{{ driftSnippetB }}</span>
        <span class="mt-1 block whitespace-pre-wrap opacity-75">{{ driftSnippetC }}</span>
      </p>
    </div>

    <!-- Headlights: boot log — reads as system coming online -->
    <div
      class="intro-narrative-boot absolute top-0 left-0 max-h-[42vh] px-[clamp(0.75rem,4vw,1.25rem)] pt-[clamp(0.75rem,3vh,1.5rem)]"
      :style="bootWrapStyle"
    >
      <p
        v-for="(line, i) in bootLines"
        :key="i"
        class="intro-narrative-boot-line m-0 mb-1 text-[clamp(0.65rem,1.9vw,0.78rem)] last:mb-0"
        :style="bootLineStyle(i)"
      >
        {{ line }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CarIntroPhase } from '../composables/useCarIntro';
import { cvData } from '../data/cv';

const props = defineProps<{
  phase: CarIntroPhase;
  driftProgress: number;
  /** How many boot log lines are shown (0–3), from real preload milestones. */
  bootLinesRevealed: number;
}>();

const devName = cvData.me.name;

const driftSnippetA = `const developer = ${JSON.stringify(devName)};`;
const driftSnippetB = 'const stack = { control: true, precision: true };';
const driftSnippetC = '// raw motion → structured systems';

const bootLines = [
  '> Initializing portfolio…',
  '> Loading CCTV feed & assets…',
  '> Fonts & layout ready.',
] as const;

const visible = computed(() =>
  props.phase !== 'idle' && props.phase !== 'done',
);

/** No CSS transition here — driftProgress updates every rAF; transitions cause lag + blurry text. */
const driftStyle = computed(() => {
  if (props.phase !== 'drift') {
    return { opacity: 0, transform: 'translate3d(0, 8px, 0)' };
  }
  const o = Math.min(1, Math.pow(props.driftProgress, 0.85) * 0.92);
  const y = Math.round((1 - props.driftProgress) * 10 * 4) / 4;
  return {
    opacity: o,
    transform: `translate3d(0, ${y}px, 0)`,
  };
});

const bootWrapStyle = computed(() => {
  if (props.phase === 'drift') {
    const o = 0.38 + 0.62 * Math.pow(props.driftProgress, 0.75);
    return {
      opacity: o,
      pointerEvents: 'none' as const,
    };
  }
  if (props.phase !== 'boot') {
    return { opacity: 0, pointerEvents: 'none' as const };
  }
  return {
    opacity: 1,
  };
});

function bootLineStyle(index: number) {
  if (props.phase !== 'drift' && props.phase !== 'boot') return { opacity: 0 };
  const revealed = props.bootLinesRevealed > index ? 1 : 0;
  return {
    opacity: revealed ? 0.92 : 0,
    transition: 'opacity 0.14s ease-out',
  };
}
</script>

<style scoped>
.intro-narrative {
  font-family: var(--font-mono);
  -webkit-font-smoothing: antialiased;
  transform: translateZ(0);
}

.intro-narrative-drift,
.intro-narrative-boot {
  backface-visibility: hidden;
}

.intro-narrative-code {
  color: rgba(220, 245, 200, 0.72);
  text-rendering: geometricPrecision;
  text-shadow:
    0 0 12px rgba(100, 200, 120, 0.15),
    0 1px 0 rgba(0, 0, 0, 0.35);
}

.intro-narrative-boot-line {
  color: rgba(235, 240, 248, 0.88);
  text-rendering: geometricPrecision;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

@media (prefers-reduced-motion: reduce) {
  .intro-narrative {
    display: none;
  }
}
</style>
