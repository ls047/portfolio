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
  <!-- Above game loader (z-index 2147483000) so mute is always reachable -->
  <SoundToggleButton class="app-sound-toggle" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DefaultLayout from './layout/index.vue';
import AppToast from './components/global/AppToast.vue';
import AppGameLoader from './components/AppGameLoader.vue';
import SoundToggleButton from './components/SoundToggleButton.vue';
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

<style scoped>
/* :deep — class is on child root; parent scoped selector would not match without it */
:deep(.app-sound-toggle) {
  position: fixed;
  top: max(1.35rem, calc(env(safe-area-inset-top, 0px) + 0.55rem));
  right: max(0.75rem, env(safe-area-inset-right, 0));
  left: auto;
  z-index: 2147483647;
  pointer-events: auto;
}

@media (min-width: 1024px) {
  :deep(.app-sound-toggle) {
    top: max(1.65rem, calc(env(safe-area-inset-top, 0px) + 0.65rem));
  }
}
</style>
