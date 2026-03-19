<template>
  <section class="section">
    <div class="container">
      <h2 class="mb-8 text-2xl font-bold text-gray-900 sm:text-3xl">
        Projects
      </h2>
      <ul class="space-y-8">
        <li
          v-for="(project, idx) in projects"
          :key="idx"
          class="border-b border-gray-200/60 pb-6 last:border-0 last:pb-0"
        >
          <h3 class="mb-2 text-lg font-semibold text-gray-900">
            {{ project.name }}
          </h3>
          <p class="mb-3 text-gray-600">
            {{ project.description }}
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(tech, i) in project.tech"
              :key="i"
              class=" rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
            >
              {{ tech }}
            </span>
          </div>
          <a
            v-if="project.link"
            :href="project.link"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-2 inline-block text-sm font-medium text-gray-700 underline hover:text-gray-900"
          >
            View project →
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CvProject } from '@/data/cv';

defineProps<{
  projects: CvProject[];
}>();
</script>
