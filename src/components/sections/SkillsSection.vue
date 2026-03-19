<template>
  <section class="section">
    <div class="container">
      <h2 class="mb-8 text-2xl font-bold text-gray-900 sm:text-3xl">
        Skills
      </h2>
      <ul class="space-y-6">
        <li
          v-for="(group, idx) in skills"
          :key="idx"
          class="flex flex-col gap-2"
        >
          <span
            v-if="group.category"
            class="text-sm font-semibold uppercase tracking-wider text-gray-500"
          >
            {{ group.category }}
          </span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(item, i) in group.items"
              :key="i"
              class="rounded-md bg-gray-200/80 px-3 py-1.5 text-sm font-medium text-gray-800"
            >
              {{ item }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CvSkill } from '@/data/cv';

defineProps<{
  skills: CvSkill[];
}>();
</script>
