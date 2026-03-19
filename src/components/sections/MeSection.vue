<template>
  <section class="section">
    <div class="container">
      <h1 class="mb-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
        {{ me.name }}
      </h1>
      <p class="mb-2 text-xl font-medium text-gray-700">
        {{ me.title }}
      </p>
      <p class="mb-6 text-lg text-gray-600">
        {{ me.location }}
      </p>
      <p
        v-if="me.summary"
        class="text-gray-600"
      >
        {{ me.summary }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CvMe } from '@/data/cv';

defineProps<{
  me: CvMe;
}>();
</script>
