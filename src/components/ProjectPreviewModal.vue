<template>
  <Teleport to="body">
    <div
      v-if="project"
      class="project-preview-root fixed inset-0 z-[2147483647] flex justify-center max-sm:items-end sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <div
        class="absolute inset-0 bg-black/75 backdrop-blur-[2px] max-sm:bg-black/82"
        aria-hidden="true"
        @click="emit('close')"
      />
      <div
        class="project-preview-panel relative flex w-full flex-col overflow-hidden border border-white/10 bg-neutral-950 shadow-[0_-12px_48px_rgba(0,0,0,0.55)] max-sm:max-h-[100dvh] max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-b-0 max-sm:border-t-white/15 max-sm:pb-[env(safe-area-inset-bottom,0px)] sm:max-h-[min(92vh,56rem)] sm:max-w-3xl sm:rounded-2xl sm:border-white/15 sm:shadow-2xl"
        @click.stop
      >
        <!-- Mobile sheet affordance -->
        <div
          class="shrink-0 pt-2 sm:hidden"
          aria-hidden="true"
        >
          <div class="mx-auto h-1 w-10 rounded-full bg-white/22" />
        </div>

        <header
          class="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-neutral-950/95 px-4 py-3 backdrop-blur-md sm:static sm:bg-neutral-950 sm:px-5 sm:py-4 sm:backdrop-blur-none"
        >
          <h2
            :id="titleId"
            class="text-balance pr-2 text-base font-semibold leading-snug text-white sm:text-lg md:text-xl"
          >
            {{ project.name }}
          </h2>
          <button
            type="button"
            class="flex size-10 shrink-0 items-center justify-center rounded-xl text-neutral-300 transition active:scale-95 hover:bg-white/12 hover:text-white sm:size-9 sm:rounded-lg"
            aria-label="Close preview"
            @click="emit('close')"
          >
            <AppIcon name="icon-[heroicons-outline--x-mark]" :size="1.125" />
          </button>
        </header>

        <div
          class="project-preview-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
        >
          <div
            class="relative w-full overflow-hidden bg-gradient-to-b from-black/40 to-black/70 max-sm:min-h-[min(38svh,280px)] max-sm:max-h-[min(46svh,340px)] sm:aspect-[16/9] sm:max-h-none sm:bg-black/50 lg:aspect-[2/1]"
          >
            <img
              v-if="heroSrc"
              :src="heroSrc"
              :alt="`Full preview: ${project.name}`"
              class="mx-auto h-full max-h-[min(46svh,340px)] w-full object-contain object-center sm:max-h-none"
              loading="eager"
              decoding="async"
              width="1200"
              height="675"
              @error="heroFailed = true"
            >
          </div>

          <div class="space-y-3.5 px-4 pb-6 pt-4 sm:space-y-4 sm:px-5 sm:pb-5 sm:pt-5">
            <p class="text-pretty text-[0.9375rem] leading-relaxed text-neutral-200 sm:text-base">
              {{ project.description }}
            </p>
            <p
              v-if="project.detail"
              class="text-pretty text-sm leading-relaxed text-neutral-400 sm:text-[0.9375rem]"
            >
              {{ project.detail }}
            </p>
            <div class="flex flex-wrap gap-2 pt-0.5">
              <span
                v-for="(tech, i) in project.tech"
                :key="i"
                class="rounded-lg bg-white/12 px-3 py-1.5 text-xs font-medium text-neutral-100 sm:rounded-md sm:px-2.5 sm:py-1"
              >
                {{ tech }}
              </span>
            </div>

            <div
              v-if="hasAnyProjectLinks"
              class="mt-3 flex flex-col gap-2.5 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <a
                v-if="project.link && !project.organizationProject"
                :href="project.link"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500/15 px-4 py-3.5 text-sm font-semibold text-sky-300 ring-1 ring-sky-400/35 transition hover:bg-sky-500/25 hover:text-sky-200 active:scale-[0.99] sm:w-auto sm:justify-center sm:rounded-lg sm:px-4 sm:py-2.5"
              >
                <AppIcon name="icon-[heroicons-outline--globe-alt]" :size="1.125" class="shrink-0" />
                Open live app
                <span aria-hidden="true">↗</span>
              </a>
              <a
                v-if="project.githubUrl && !project.organizationProject"
                :href="project.githubUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3.5 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.99] sm:w-auto sm:justify-center sm:rounded-lg sm:px-4 sm:py-2.5"
              >
                <AppIcon name="icon-[simple-icons--github]" :size="1.125" class="shrink-0" />
                View on GitHub
                <span aria-hidden="true">↗</span>
              </a>
              <button
                v-if="project.organizationProject"
                type="button"
                class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/8 px-4 py-3.5 text-sm font-semibold text-neutral-300 ring-1 ring-white/12 transition hover:bg-white/12 hover:text-white active:scale-[0.99] sm:w-auto sm:justify-center sm:rounded-lg sm:px-4 sm:py-2.5"
                @click="showOrgSourceDialog = true"
              >
                <AppIcon name="icon-[simple-icons--github]" :size="1.125" class="shrink-0 opacity-60" />
                Source code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="project && showOrgSourceDialog"
      class="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="org-source-dialog-title"
    >
      <div
        class="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-hidden="true"
        @click="showOrgSourceDialog = false"
      />
      <div
        class="relative max-w-md rounded-2xl border border-white/12 bg-neutral-950 px-5 py-5 shadow-2xl sm:px-6 sm:py-6"
        @click.stop
      >
        <h3
          id="org-source-dialog-title"
          class="font-semibold text-white"
        >
          Source not available
        </h3>
        <p class="mt-3 text-pretty text-sm leading-relaxed text-neutral-300">
          Sorry — this project was built for an organization, so the source code isn’t publicly available.
        </p>
        <button
          type="button"
          class="mt-5 w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 sm:w-auto sm:px-6"
          @click="showOrgSourceDialog = false"
        >
          OK
        </button>
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
const showOrgSourceDialog = ref(false);

watch(
  () => props.project,
  () => {
    heroFailed.value = false;
    showOrgSourceDialog.value = false;
  }
);

const hasAnyProjectLinks = computed(() => {
  const p = props.project;
  if (!p) return false;
  return Boolean(
    (p.link && !p.organizationProject) ||
      (p.githubUrl && !p.organizationProject) ||
      p.organizationProject
  );
});

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
  if (e.key === 'Escape' && props.project) {
    if (showOrgSourceDialog.value) {
      showOrgSourceDialog.value = false;
    } else {
      emit('close');
    }
  }
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
