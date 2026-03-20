<template>
  <section :class="projectsSectionRootClass">
    <div :class="sectionContentClass">
      <h2
        class="reading-head mb-6 text-balance text-xl font-bold sm:mb-8 sm:text-2xl md:text-3xl"
        v-reading-chars="'Projects'"
      />
      <ul class="m-0 w-full min-w-0 max-w-full list-none space-y-8 p-0 sm:space-y-10" role="list">
        <li
          v-for="(project, idx) in projects"
          :key="idx"
          class="project-card reading-border w-full min-w-0 max-w-full border-b pb-8 break-words last:border-0 last:pb-0"
        >
          <div
            class="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,38%)_minmax(0,1fr)] sm:items-start sm:gap-6"
          >
            <div
              class="reading-border aspect-[16/10] overflow-hidden rounded-[0.875rem] border border-solid bg-black/[0.18]"
            >
              <img
                class="block h-full w-full object-cover object-center"
                :src="imageUrlFor(idx, project)"
                :alt="`Preview: ${project.name}`"
                loading="lazy"
                decoding="async"
                width="960"
                height="600"
                @error="onImgError(idx)"
              >
            </div>
            <div class="project-card-body min-w-0">
              <h3
                class="reading-head mb-2 max-w-full text-lg font-semibold break-words sm:text-xl"
                v-reading-chars="project.name"
              />
              <p
                class="reading-muted mb-3 w-full max-w-full min-w-0 text-pretty text-sm leading-relaxed [overflow-wrap:anywhere] sm:text-base"
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
                class="reading-link mt-3 inline-block max-w-full break-all text-sm font-medium underline"
                v-reading-chars="'View project →'"
              />
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { CvProject } from '@/data/cv';
import { projectsSectionRootClass, sectionContentClass } from '@/constants/sectionLayout';
import { DEFAULT_PROJECT_IMAGE_URL, publicUrl } from '@/constants/projectAssets';

const props = defineProps<{
  projects: CvProject[];
}>();

function resolveSrc(p: CvProject): string {
  const raw = p.image?.trim();
  if (raw) return publicUrl(raw);
  return publicUrl(DEFAULT_PROJECT_IMAGE_URL);
}

/** Indices that failed to load -> show placeholder */
const loadFailed = reactive<Record<number, true>>({});

function imageUrlFor(idx: number, p: CvProject): string {
  if (loadFailed[idx]) return publicUrl(DEFAULT_PROJECT_IMAGE_URL);
  return resolveSrc(p);
}

function onImgError(idx: number) {
  loadFailed[idx] = true;
}

watch(
  () => props.projects,
  () => {
    for (const k of Object.keys(loadFailed)) {
      delete loadFailed[Number(k)];
    }
  },
  { deep: true }
);
</script>
