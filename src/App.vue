<template>
  <AppGameLoader
    v-if="!hasStarted"
    :progress="loadProgress"
    :loading-complete="loadingComplete"
    @start="onStart"
  />
  <template v-else>
    <DefaultLayout>
      <RouterView />
    </DefaultLayout>
    <AppToast :toasts="toasts" @remove="removeToast" />
  </template>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DefaultLayout from './layout/index.vue';
import AppToast from './components/global/AppToast.vue';
import AppGameLoader from './components/AppGameLoader.vue';
import { useToast } from './composables/useToast';
import { runAppBootstrap } from './bootstrap/runAppBootstrap';

const { toasts, remove: removeToast } = useToast();

const loadProgress = ref(0);
const loadingComplete = ref(false);
const hasStarted = ref(false);

onMounted(async () => {
  document.body.style.overflow = 'hidden';
  try {
    await runAppBootstrap((p) => {
      loadProgress.value = p;
    });
  } catch (e) {
    console.error('App bootstrap failed', e);
  } finally {
    loadProgress.value = 100;
    loadingComplete.value = true;
  }
});

function onStart() {
  hasStarted.value = true;
  document.body.style.overflow = '';
}
</script>
