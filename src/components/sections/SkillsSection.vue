<template>
  <section :class="sectionRootClass">
    <div :class="sectionContentClass">
      <h2
        class="reading-head mb-2 text-[clamp(1.375rem,4vw,1.875rem)] font-bold tracking-tight"
        v-reading-chars="SKILLS_TITLE"
      />
      <p
        class="reading-muted mb-8 max-w-none text-sm leading-relaxed sm:max-w-lg sm:leading-[1.55] md:max-lg:max-w-2xl"
        v-reading-chars="SKILLS_INTRO"
      />

      <ul class="m-0 flex list-none flex-col gap-8 p-0" role="list">
        <li
          v-for="(group, idx) in skills"
          :key="idx"
        >
          <h3
            v-if="group.category"
            class="reading-subtle mb-3.5 text-[0.7rem] font-bold uppercase tracking-[0.14em]"
            v-reading-chars="group.category"
          />
          <ul class="m-0 flex list-none flex-col gap-[1.125rem] p-0" role="list">
            <li
              v-for="(item, i) in group.items"
              :key="`${idx}-${i}`"
            >
              <div class="mb-[0.35rem] flex items-baseline justify-between gap-4">
                <span
                  class="reading-body text-[0.9375rem] font-semibold"
                  v-reading-chars="item.name"
                />
                <span
                  class="reading-subtle text-xs font-semibold tabular-nums"
                  aria-hidden="true"
                  v-reading-chars="`${clampMastery(item.mastery)}%`"
                />
              </div>
              <div
                class="reading-border h-2 overflow-hidden rounded-full border border-solid bg-[color-mix(in_srgb,var(--color-border)_35%,transparent)] shadow-[inset_0_2px_4px_color-mix(in_srgb,var(--color-text)_12%,transparent),inset_0_-1px_0_color-mix(in_srgb,var(--color-background)_50%,transparent)]"
                role="progressbar"
                :aria-valuenow="clampMastery(item.mastery)"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`Mastery for ${item.name}: ${clampMastery(item.mastery)} percent`"
              >
                <div
                  class="h-full min-w-1 rounded-full bg-[#ffffff] shadow-[0_0_14px_rgba(255,255,255,0.45)] transition-[width] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  :style="{ width: `${clampMastery(item.mastery)}%` }"
                />
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CvSkill } from '@/data/cv';
import { sectionContentClass, sectionRootClass } from '@/constants/sectionLayout';

/** Static copy for v-reading-chars (avoids huge literals in template). */
const SKILLS_TITLE = 'Skills';
const SKILLS_INTRO =
  'Mastery is self-assessed from day-to-day project work — progress shows relative comfort, not a test score.';

defineProps<{
  skills: CvSkill[];
}>();

function clampMastery(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
</script>
