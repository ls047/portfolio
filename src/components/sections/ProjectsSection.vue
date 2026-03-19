<template>
  <section :class="projectsSectionRootClass">
    <div :class="sectionContentClass">
      <h2
        class="reading-head mb-6 text-balance text-xl font-bold sm:mb-8 sm:text-2xl md:text-3xl"
        v-reading-chars="'Projects'"
      />
      <ul class="w-full min-w-0 max-w-full space-y-8">
        <li
          v-for="(project, idx) in projects"
          :key="idx"
          class="reading-border w-full min-w-0 max-w-full border-b pb-6 break-words last:border-0 last:pb-0"
        >
          <h3
            class="reading-head mb-2 max-w-full text-lg font-semibold break-words"
            v-reading-chars="project.name"
          />
          <p
            class="reading-muted mb-3 w-full max-w-full min-w-0 text-pretty break-words [overflow-wrap:anywhere]"
            v-reading-chars="project.description"
          />
          <div class="flex min-w-0 max-w-full flex-wrap gap-2">
            <span
              v-for="(tech, i) in project.tech"
              :key="i"
              class="reading-chip max-w-full break-words rounded px-2 py-0.5 text-xs font-medium"
              v-reading-chars="tech"
            />
          </div>
          <a
            v-if="project.link"
            :href="project.link"
            target="_blank"
            rel="noopener noreferrer"
            class="reading-link mt-2 inline-block max-w-full break-all text-sm font-medium underline"
            v-reading-chars="'View project →'"
          />
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CvProject } from '@/data/cv';
import { projectsSectionRootClass, sectionContentClass } from '@/constants/sectionLayout';

defineProps<{
  projects: CvProject[];
}>();
</script>
