<template>
  <button
    type="button"
    class="sound-toggle"
    :aria-pressed="siteSoundMuted"
    :aria-label="siteSoundMuted ? 'Unmute site sounds' : 'Mute site sounds'"
    :title="siteSoundMuted ? 'Unmute sounds' : 'Mute sounds'"
    @click="toggleSiteSoundMuted"
  >
    <span class="reading-icon sound-toggle-icon">
      <AppIcon
        :name="siteSoundMuted ? 'icon-[heroicons-outline--speaker-x-mark]' : 'icon-[heroicons-outline--speaker-wave]'"
        :size="1.15"
      />
    </span>
  </button>
</template>

<script setup lang="ts">
import AppIcon from './global/AppIcon.vue';
import { siteSoundMuted, toggleSiteSoundMuted } from '@/composables/siteSound';
</script>

<style scoped>
.sound-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(14, 14, 18, 0.62);
  color: rgba(245, 245, 245, 0.94);
  backdrop-filter: blur(10px);
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.sound-toggle:hover {
  background: rgba(28, 28, 34, 0.82);
  border-color: rgba(255, 255, 255, 0.22);
}

.sound-toggle:focus-visible {
  outline: 2px solid rgba(253, 224, 71, 0.55);
  outline-offset: 3px;
}

.sound-toggle-icon {
  display: inline-flex;
  color: inherit;
}

.sound-toggle-icon :deep(svg),
.sound-toggle-icon :deep(.iconify) {
  color: inherit;
}

@media (prefers-reduced-motion: reduce) {
  .sound-toggle {
    transition-duration: 0.01ms;
  }
}
</style>
