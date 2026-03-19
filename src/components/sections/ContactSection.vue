<template>
  <section :class="sectionRootClass">
    <div :class="sectionContentClass">
      <h2
        class="reading-head mb-8 text-2xl font-bold sm:text-3xl"
        v-reading-chars="'Contact'"
      />
      <div class="space-y-6">
        <div>
          <a
            :href="`tel:${phone}`"
            class="reading-link underline"
            v-reading-chars="phone"
          />
        </div>
        <div>
          <a
            :href="`mailto:${email}`"
            class="reading-link underline"
            v-reading-chars="email"
          />
        </div>
        <div v-if="languages?.length">
          <span
            class="reading-subtle text-sm font-medium"
            v-reading-chars="'Languages'"
          />
          <ul class="mt-1 space-y-1">
            <li
              v-for="(lang, idx) in languages"
              :key="idx"
              class="reading-body"
              v-reading-chars="`${lang.name}: ${lang.level}`"
            />
          </ul>
        </div>
        <div v-if="links?.length">
          <span
            class="reading-subtle text-sm font-medium"
            v-reading-chars="'Links'"
          />
          <ul class="mt-2 space-y-2">
            <li
              v-for="(link, idx) in links"
              :key="idx"
            >
              <a
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="reading-link underline"
                v-reading-chars="`${link.label} →`"
              />
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { sectionContentClass, sectionRootClass } from '@/constants/sectionLayout';

defineProps<{
  phone: string;
  email: string;
  languages: { name: string; level: string }[];
  links: { label: string; url: string }[];
}>();
</script>
