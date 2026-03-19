<template>
  <section :class="sectionRootClass">
    <div :class="sectionContentClass">
      <h2
        class="reading-head mb-8 text-2xl font-bold sm:text-3xl"
        v-reading-chars="'Experiences'"
      />
      <ul class="space-y-10">
        <li
          v-for="(exp, idx) in experiences"
          :key="idx"
          class="reading-border border-b pb-8 last:border-0 last:pb-0"
        >
          <div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h3
              class="reading-head text-lg font-semibold"
              v-reading-chars="exp.company"
            />
            <span
              class="reading-subtle text-sm"
              v-reading-chars="exp.period"
            />
          </div>
          <p
            class="reading-body mb-2 font-medium"
            v-reading-chars="exp.role"
          />
          <p
            class="reading-muted"
            v-reading-chars="exp.description"
          />
        </li>
        <li class="reading-border border-b pb-8 last:border-0">
          <div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h3
              class="reading-head text-lg font-semibold"
              v-reading-chars="education.school"
            />
            <span
              class="reading-subtle text-sm"
              v-reading-chars="education.period"
            />
          </div>
          <p
            class="reading-body mb-2 font-medium"
            v-reading-chars="education.degree"
          />
          <p
            v-if="education.description"
            class="reading-muted"
            v-reading-chars="education.description"
          />
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CvExperience, CvEducation } from '@/data/cv';
import { sectionContentClass, sectionRootClass } from '@/constants/sectionLayout';

defineProps<{
  experiences: CvExperience[];
  education: CvEducation;
}>();
</script>
