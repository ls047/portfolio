<template>
  <button
    type="button"
    class="inline-flex size-[2.65rem] cursor-pointer items-center justify-center rounded-full border border-white/14 bg-[rgb(14_14_18_/_0.62)] text-[rgb(245_245_245_/_0.94)] shadow-[0_2px_12px_rgb(0_0_0_/_0.35)] backdrop-blur-[10px] transition-[background-color,border-color,color] duration-200 ease-in-out hover:border-white/[0.22] hover:bg-[rgb(28_28_34_/_0.82)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(253_224_71_/_0.55)] focus-visible:ring-offset-[3px] focus-visible:ring-offset-[rgb(14_14_18_/_0.62)] motion-reduce:transition-none motion-reduce:duration-0"
    :aria-pressed="siteSoundMuted"
    :aria-label="siteSoundMuted ? 'Unmute site sounds' : 'Mute site sounds'"
    :title="siteSoundMuted ? 'Unmute sounds' : 'Mute sounds'"
    @click="toggleSiteSoundMuted"
  >
    <span class="reading-icon inline-flex text-inherit [&_.iconify]:text-inherit [&_svg]:text-inherit">
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
