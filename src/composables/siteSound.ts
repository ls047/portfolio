import { ref } from 'vue';

const STORAGE_KEY = 'portfolio-site-sound-muted';

function readInitialMuted(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function persist(muted: boolean) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    /* private mode / quota */
  }
}

/** Global mute for portfolio sound (scroll ambience, intro SFX). */
export const siteSoundMuted = ref(readInitialMuted());

export function toggleSiteSoundMuted(): void {
  siteSoundMuted.value = !siteSoundMuted.value;
  persist(siteSoundMuted.value);
}

export function setSiteSoundMuted(muted: boolean): void {
  if (siteSoundMuted.value === muted) return;
  siteSoundMuted.value = muted;
  persist(muted);
}
