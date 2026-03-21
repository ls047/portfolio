<template>
  <AppGameLoader
    v-if="!hasStarted"
    :progress="loadProgress"
    :loading-complete="loadingComplete"
    @start="onStart"
  />
  <!-- After Enter: layout + home chunk so initial load isn’t parsing layout/useCarIntro + all sections (mobile TBT). -->
  <template v-if="bootstrapComplete && hasStarted">
    <DefaultLayout>
      <RouterView v-if="homeRouteReady" />
    </DefaultLayout>
    <AppToast v-if="homeRouteReady" :toasts="toasts" @remove="removeToast" />
  </template>
  <!-- Above game loader (z-index 2147483000), below project preview modal (2147483647) -->
  <SoundToggleButton
    class="pointer-events-auto fixed top-[calc(max(1.95rem,env(safe-area-inset-top,0px))+0.875rem)] right-[max(0.75rem,env(safe-area-inset-right,0))] left-auto z-[2147483646]"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, defineAsyncComponent } from 'vue';

const DefaultLayout = defineAsyncComponent(() => import('./layout/index.vue'));
const AppToast = defineAsyncComponent(() => import('./components/global/AppToast.vue'));
import AppGameLoader from './components/AppGameLoader.vue';
import SoundToggleButton from './components/SoundToggleButton.vue';
import { useToast } from './composables/useToast';
import { carIntroScrollUnlocked, carIntroStartRequested } from './composables/appLoadGate';
import { shouldSkipHeavyIntro } from './utils/perfSkip';
import { runAppBootstrap } from './bootstrap/runAppBootstrap';

const { toasts, remove: removeToast } = useToast();

const loadProgress = ref(0);
const loadingComplete = ref(false);
const bootstrapComplete = ref(false);
const hasStarted = ref(false);
const homeRouteReady = ref(false);

function scheduleHomeRoute() {
  const show = () => {
    homeRouteReady.value = true;
  };
  /* Narrow viewports: shorter idle cap so home mounts soon after Enter without a long queued task. */
  const idleCap = shouldSkipHeavyIntro() ? 900 : 2000;
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(show, { timeout: idleCap });
  } else {
    setTimeout(show, shouldSkipHeavyIntro() ? 48 : 120);
  }
}

onMounted(async () => {
  document.body.style.overflow = 'hidden';
  try {
    await runAppBootstrap((p) => {
      loadProgress.value = Math.round(p * 0.92);
    });
    bootstrapComplete.value = true;
    loadProgress.value = 92;
  } catch (e) {
    console.error('App bootstrap failed', e);
    bootstrapComplete.value = true;
    loadProgress.value = 100;
    loadingComplete.value = true;
  }
});

watch(
  bootstrapComplete,
  (boot) => {
    if (!boot) return;
    loadProgress.value = 100;
    loadingComplete.value = true;
  },
  { immediate: true }
);

watch(
  [hasStarted, bootstrapComplete],
  ([started, boot]) => {
    if (!boot || !started) return;
    scheduleHomeRoute();
  },
  { immediate: true }
);

/** Keep body locked until car intro has revealed content (scroll lives on `.content-scroll` in layout). */
watch(
  carIntroScrollUnlocked,
  (unlocked) => {
    if (unlocked) document.body.style.overflow = '';
  },
  { immediate: true }
);

function onStart() {
  carIntroStartRequested.value = true;
  hasStarted.value = true;
}
</script>
