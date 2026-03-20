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
  <SoundToggleButton
    class="pointer-events-auto fixed top-[calc(max(1.95rem,env(safe-area-inset-top,0px))+0.875rem)] right-[max(0.75rem,env(safe-area-inset-right,0))] left-auto z-[2147483647]"
  />
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
