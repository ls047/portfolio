<template>
  <section :class="sectionRootClass">
    <div :class="sectionContentClass">
      <h2
        class="reading-head mb-6 text-balance text-xl font-bold sm:mb-8 sm:text-2xl md:text-3xl"
        v-reading-chars="'About me'"
      />
      <p
        v-if="about.intro"
        class="reading-muted mb-10 max-w-prose text-pretty text-sm leading-relaxed sm:mb-12 sm:text-base"
        v-reading-chars="about.intro"
      />

      <div class="space-y-10 sm:space-y-12">
        <div>
          <h3
            class="reading-head mb-4 text-base font-semibold sm:text-lg"
            v-reading-chars="'Hobbies'"
          />
          <ul
            class="m-0 flex list-none flex-wrap gap-2 p-0"
            role="list"
          >
            <li
              v-for="(hobby, i) in about.hobbies"
              :key="i"
            >
              <span
                class="reading-chip inline-block max-w-full break-words rounded-lg px-3 py-1.5 text-xs font-medium sm:rounded-md sm:px-2.5 sm:py-1 sm:text-[0.8125rem]"
                v-reading-chars="hobby"
              />
            </li>
          </ul>
        </div>

        <div class="reading-border border-t border-solid pt-10 sm:pt-12">
          <h3
            class="reading-head mb-3 text-base font-semibold sm:text-lg"
            v-reading-chars="'Favorite artist'"
          />
          <div class="flex flex-wrap items-center gap-2 sm:gap-3">
            <p
              class="reading-head text-lg font-semibold sm:text-xl"
              v-reading-chars="about.favoriteArtist.name"
            />
            <a
              v-if="about.favoriteArtist.favoriteSongYoutubeUrl"
              :href="about.favoriteArtist.favoriteSongYoutubeUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="about-song-cta reading-border group inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-solid px-3 py-2 text-sm shadow-sm active:scale-[0.98] sm:min-h-9 sm:px-3.5 sm:py-1.5"
              :title="
                about.favoriteArtist.favoriteSong
                  ? `Play “${about.favoriteArtist.favoriteSong}” on YouTube`
                  : 'Open on YouTube'
              "
              :aria-label="
                about.favoriteArtist.favoriteSong
                  ? `Open “${about.favoriteArtist.favoriteSong}” on YouTube`
                  : 'Open favorite song on YouTube'
              "
            >
              <span
                class="reading-icon opacity-90"
                aria-hidden="true"
              >
                <AppIcon
                  name="icon-[heroicons-outline--musical-note]"
                  :size="1.125"
                />
              </span>
              <span
                class="reading-link whitespace-nowrap font-semibold"
                v-reading-chars="'Listen'"
              />
            </a>
          </div>
          <p
            v-if="about.favoriteArtist.genres"
            class="reading-muted mt-2 max-w-prose text-pretty text-sm leading-relaxed sm:text-base"
            v-reading-chars="about.favoriteArtist.genres"
          />
        </div>

        <div class="reading-border border-t border-solid pt-10 sm:pt-12">
          <h3
            class="reading-head mb-6 text-base font-semibold sm:mb-8 sm:text-lg"
            v-reading-chars="'Gaming skills'"
          />
          <p
            class="reading-muted mb-6 max-w-none text-sm leading-relaxed sm:max-w-lg sm:leading-[1.55] md:max-lg:max-w-2xl"
            v-reading-chars="GAMING_INTRO"
          />
          <ul class="m-0 flex list-none flex-col gap-[1.125rem] p-0" role="list">
            <li
              v-for="(item, i) in about.gamingSkills"
              :key="i"
            >
              <div class="mb-[0.35rem] flex items-baseline justify-between gap-4">
                <span
                  class="text-[0.9375rem] font-semibold text-[var(--skills-ink)]"
                  v-reading-chars="item.name"
                />
                <span
                  class="text-xs font-semibold tabular-nums text-[var(--skills-muted)]"
                  aria-hidden="true"
                  v-reading-chars="`${clampMastery(item.mastery)}%`"
                />
              </div>
              <div
                class="reading-border h-2 overflow-hidden rounded-full border border-solid bg-[var(--section-progress-track,rgba(28,25,23,0.2))] shadow-[inset_0_2px_4px_var(--section-progress-track-shade,rgba(12,10,9,0.18)),inset_0_-1px_0_var(--skills-track-highlight,rgba(255,250,240,0.07))]"
                role="progressbar"
                :aria-valuenow="clampMastery(item.mastery)"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`Gaming — ${item.name}: ${clampMastery(item.mastery)} percent`"
              >
                <div
                  class="h-full min-w-1 rounded-full bg-[#ffffff] shadow-[0_0_14px_rgba(255,255,255,0.45)] transition-[width] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  :style="{ width: `${clampMastery(item.mastery)}%` }"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CvAboutMe } from '@/data/cv';
import { sectionContentClass, sectionRootClass } from '@/constants/sectionLayout';
import AppIcon from '@/components/global/AppIcon.vue';

defineProps<{
  about: CvAboutMe;
}>();

const GAMING_INTRO =
  'Comfort with different game styles — self-rated like Skills, from what I play regularly.';

function clampMastery(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
</script>

<style scoped>
/* Same section theme as Contact cards: --section-chip-bg / --section-divider from useReadingContrast. */
.about-song-cta {
  text-decoration: none;
  background: color-mix(in srgb, var(--section-chip-bg, rgba(0, 0, 0, 0.08)) 42%, transparent);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

@media (hover: hover) and (pointer: fine) {
  .about-song-cta:hover {
    transform: translateY(-1px);
    background: color-mix(in srgb, var(--section-chip-bg, rgba(0, 0, 0, 0.08)) 62%, transparent);
    box-shadow:
      0 10px 28px rgba(0, 0, 0, 0.1),
      0 0 0 1px var(--reading-border-sync, var(--section-divider));
  }
}

.about-song-cta:focus-visible {
  outline: 2px solid var(--section-link, currentColor);
  outline-offset: 3px;
}
</style>
