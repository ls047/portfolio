<template>
  <Teleport to="body">
    <div
      v-if="project"
      class="project-preview-root fixed inset-0 z-[220] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <div
        class="absolute inset-0 bg-black/80 backdrop-blur-[3px]"
        aria-hidden="true"
        @click="emit('close')"
      />
      <div
        class="project-preview-panel relative flex max-h-[min(92vh,56rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-white/12 bg-neutral-950/97 shadow-2xl sm:rounded-2xl sm:border-white/15"
        @click.stop
      >
        <header class="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <h2
            :id="titleId"
            class="text-balance pr-2 text-lg font-semibold leading-snug text-white sm:text-xl"
          >
            {{ project.name }}
          </h2>
          <button
            type="button"
            class="flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close preview"
            @click="emit('close')"
          >
            <AppIcon name="icon-[heroicons-outline--x-mark]" :size="1.125" />
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div
            class="aspect-[16/9] w-full overflow-hidden bg-black/50 sm:aspect-[2/1]"
          >
            <img
              v-if="heroSrc"
              :src="heroSrc"
              :alt="`Full preview: ${project.name}`"
              class="h-full w-full object-contain object-center"
              loading="eager"
              decoding="async"
              width="1200"
              height="675"
              @error="heroFailed = true"
            >
          </div>

          <div class="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
            <p class="text-pretty text-sm leading-relaxed text-neutral-300 sm:text-base">
              {{ project.description }}
            </p>
            <p
              v-if="project.detail"
              class="text-pretty text-sm leading-relaxed text-neutral-400 sm:text-[0.9375rem]"
            >
              {{ project.detail }}
            </p>
            <div class="flex flex-wrap gap-2 pt-1">
              <span
                v-for="(tech, i) in project.tech"
                :key="i"
                class="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-neutral-200"
              >
                {{ tech }}
              </span>
            </div>
            <a
              v-if="project.link"
              :href="project.link"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-sky-400 underline-offset-4 hover:text-sky-300 hover:underline"
            >
              Open live project
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { CvProject } from '@/data/cv';
import { DEFAULT_PROJECT_IMAGE_URL, publicUrl } from '@/constants/projectAssets';
import AppIcon from '@/components/global/AppIcon.vue';

const props = defineProps<{
  project: CvProject | null;
}>();

const emit = defineEmits<{ close: [] }>();

const scrollContainerRef = inject<Ref<HTMLElement | null>>('scrollContainerRef');

const titleId = 'project-preview-title';

const heroFailed = ref(false);

watch(
  () => props.project,
  () => {
    heroFailed.value = false;
  }
);

function resolveHeroUrl(p: CvProject): string {
  const raw = (p.modalImage ?? p.image)?.trim();
  if (raw) return publicUrl(raw);
  return publicUrl(DEFAULT_PROJECT_IMAGE_URL);
}

const heroSrc = computed(() => {
  if (!props.project) return '';
  if (heroFailed.value) return publicUrl(DEFAULT_PROJECT_IMAGE_URL);
  return resolveHeroUrl(props.project);
});

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.project) emit('close');
}

const savedScrollOverflow = ref<string | null>(null);

watch(
  () => props.project,
  (p: CvProject | null) => {
    const el = scrollContainerRef?.value;
    if (!el) return;
    if (p) {
      if (savedScrollOverflow.value === null) {
        savedScrollOverflow.value = el.style.overflow;
      }
      el.style.overflow = 'hidden';
    } else {
      el.style.overflow = savedScrollOverflow.value ?? '';
      savedScrollOverflow.value = null;
    }
  }
);

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  const el = scrollContainerRef?.value;
  if (el && savedScrollOverflow.value !== null) {
    el.style.overflow = savedScrollOverflow.value;
    savedScrollOverflow.value = null;
  }
});
</script>
