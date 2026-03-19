<template>
  <section :class="sectionRootClass">
    <div :class="sectionContentClass">
      <h1
        class="reading-head mb-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
        v-reading-chars="me.name"
      />
      <p
        class="reading-body mb-2 text-xl font-medium"
        v-reading-chars="me.title"
      />
      <p
        class="reading-muted mb-6 text-lg"
        v-reading-chars="me.location"
      />
      <p
        v-if="me.summary"
        class="reading-muted"
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
