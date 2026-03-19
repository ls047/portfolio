<template>
  <section :class="sectionRootClass">
    <div :class="sectionContentClass">
      <h1
        class="reading-head mb-2 text-balance text-[clamp(1.875rem,6.5vw,2.25rem)] font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
        v-reading-chars="me.name"
      />
      <p
        class="reading-body mb-2 text-lg font-medium sm:text-xl"
        v-reading-chars="me.title"
      />
      <p
        class="reading-muted mb-6 text-base sm:text-lg"
        v-reading-chars="me.location"
      />
      <p
        v-if="me.summary"
        class="reading-muted max-w-prose text-pretty text-base leading-relaxed sm:text-lg sm:leading-relaxed"
        v-reading-chars="me.summary"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CvMe } from '@/data/cv';
import { sectionContentClass, sectionRootClass } from '@/constants/sectionLayout';

defineProps<{
  me: CvMe;
}>();
</script>
