<template>
  <div
    v-show="visible"
    class="tire-decoration"
    aria-hidden="true"
  >
    <div
      ref="tireContainer"
      class="tire-canvas-wrapper"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTireDecoration } from '../composables/useTireDecoration';

defineProps<{
  visible: boolean;
}>();

const tireContainer = ref<HTMLElement | null>(null);

useTireDecoration(tireContainer);
</script>

<style scoped>
.tire-decoration {
  position: fixed;
  right: 0;
  top: 0;
  width: min(22vw, 320px);
  height: 100vh;
  overflow: hidden;
  z-index: 5;
  pointer-events: none;
  transition: opacity 0.8s ease-out;
}

.tire-canvas-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
