<template>
  <div class="layout-container">
    <!-- 3D Canvas - car intro (from useCarIntro) -->
    <div
      ref="canvasContainer"
      class="fixed inset-0 z-0 w-full h-full"
    />

    <!-- Gear shifter - manual mode only -->
    <GearShifter
      v-show="isManual"
      :content-opacity="contentOpacity"
    />

    <!-- Tire decoration - auto mode only, half visible on right, infinite rotation -->
    <TireDecoration
      :visible="isAutomatic"
      :style="{ opacity: contentOpacity }"
    />

    <!-- Mode toggle: Android-style switch (Manual = on, Auto = off) -->
    <button
      type="button"
      role="switch"
      class="nav-mode-switch"
      :style="{ opacity: contentOpacity }"
      :aria-checked="isManual"
      :aria-label="isManual ? 'Manual mode (gear). Switch to scroll.' : 'Auto mode (scroll). Switch to gear.'"
      title="Manual: gear | Auto: scroll"
      @click="toggleMode"
    >
      <span class="switch-track">
        <span
          class="switch-thumb"
          :class="{ 'switch-thumb-on': isManual }"
        />
      </span>
      <span class="switch-label">{{ isManual ? 'Manual' : 'Auto' }}</span>
    </button>

    <!-- Page content - revealed after car intro -->
    <div
      ref="contentOverlayRef"
      class="content-overlay relative z-10"
      :class="{ 'content-scroll': !isManual }"
      :style="{ opacity: contentOpacity }"
    >
      <slot />
    </div>

    <!-- Custom scrollbar with 3D car - auto/scroll mode only -->
    <CustomScrollbar
      :scroll-container-ref="contentOverlayRef"
      :visible="isAutomatic"
      :content-opacity="contentOpacity"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCarIntro } from '../composables/useCarIntro';
import { useNavigationMode } from '../composables/useNavigationMode';
import GearShifter from '../components/GearShifter.vue';
import TireDecoration from '../components/TireDecoration.vue';
import CustomScrollbar from '../components/CustomScrollbar.vue';

const canvasContainer = ref<HTMLElement | null>(null);
const contentOverlayRef = ref<HTMLElement | null>(null);

const { contentOpacity } = useCarIntro(canvasContainer);
const { isManual, isAutomatic, toggleMode } = useNavigationMode();
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  overflow: hidden;
  position: relative;
}

.content-overlay {
  min-height: 100vh;
  overflow: hidden;
  /* no bg - lights behind are enough */
  transition: opacity 0.8s ease-out;
}

.content-overlay.content-scroll {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.content-overlay.content-scroll::-webkit-scrollbar {
  display: none;
}

/* Android-style on/off switch */
.nav-mode-switch {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: rgba(25, 25, 25, 0.95);
  border: 1px solid #333;
  border-radius: 20px;
  cursor: pointer;
  transition: opacity 0.8s ease-out, border-color 0.2s;
}

.nav-mode-switch:hover {
  border-color: #555;
}

.switch-track {
  position: relative;
  width: 44px;
  height: 24px;
  background: #3a3a3a;
  border-radius: 12px;
  transition: background 0.2s;
}

.switch-track::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  transition: background 0.2s;
}

.nav-mode-switch[aria-checked='true'] .switch-track {
  background: rgba(201, 162, 39, 0.35);
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #888;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s ease, background 0.2s;
}

.switch-thumb-on {
  transform: translateX(20px);
  background: #c9a227;
  box-shadow: 0 1px 3px rgba(201, 162, 39, 0.4);
}

.switch-label {
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  min-width: 42px;
}
</style>
