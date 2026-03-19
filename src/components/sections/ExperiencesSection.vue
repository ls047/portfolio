<template>
  <section class="section">
    <div class="container">
      <h2 class="mb-8 text-2xl font-bold text-gray-900 sm:text-3xl">
        Experiences
      </h2>
      <ul class="space-y-10">
        <li
          v-for="(exp, idx) in experiences"
          :key="idx"
          class="border-b border-gray-200/60 pb-8 last:border-0 last:pb-0"
        >
          <div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ exp.company }}
            </h3>
            <span class="text-sm text-gray-500">
              {{ exp.period }}
            </span>
          </div>
          <p class="mb-2 font-medium text-gray-700">
            {{ exp.role }}
          </p>
          <p class="text-gray-600">
            {{ exp.description }}
          </p>
        </li>
        <li class="border-b border-gray-200/60 pb-8 last:border-0">
          <div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ education.school }}
            </h3>
            <span class="text-sm text-gray-500">
              {{ education.period }}
            </span>
          </div>
          <p class="mb-2 font-medium text-gray-700">
            {{ education.degree }}
          </p>
          <p
            v-if="education.description"
            class="text-gray-600"
          >
            {{ education.description }}
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CvExperience, CvEducation } from '@/data/cv';

defineProps<{
  experiences: CvExperience[];
  education: CvEducation;
}>();
</script>
