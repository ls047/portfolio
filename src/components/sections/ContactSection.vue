<template>
  <section class="section">
    <div class="container">
      <h2 class="mb-8 text-2xl font-bold text-gray-900 sm:text-3xl">
        Contact
      </h2>
      <div class="space-y-6">
        <div>
          <a
            :href="`tel:${phone}`"
            class="text-gray-700 hover:text-gray-900 hover:underline"
          >
            {{ phone }}
          </a>
        </div>
        <div>
          <a
            :href="`mailto:${email}`"
            class="text-gray-700 hover:text-gray-900 hover:underline"
          >
            {{ email }}
          </a>
        </div>
        <div v-if="languages?.length">
          <span class="text-sm font-medium text-gray-500">Languages</span>
          <ul class="mt-1 space-y-1">
            <li
              v-for="(lang, idx) in languages"
              :key="idx"
              class="text-gray-700"
            >
              {{ lang.name }}: {{ lang.level }}
            </li>
          </ul>
        </div>
        <div v-if="links?.length">
          <span class="text-sm font-medium text-gray-500">Links</span>
          <ul class="mt-2 space-y-2">
            <li
              v-for="(link, idx) in links"
              :key="idx"
            >
              <a
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-700 hover:text-gray-900 hover:underline"
              >
                {{ link.label }} →
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  phone: string;
  email: string;
  languages: { name: string; level: string }[];
  links: { label: string; url: string }[];
}>();
</script>
