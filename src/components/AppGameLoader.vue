<template>
  <div
    class="game-loader"
    aria-labelledby="game-loader-title"
    :aria-busy="!loadingComplete"
  >
    <div class="game-loader-ambient" aria-hidden="true" />
    <div class="game-loader-vignette" aria-hidden="true" />
    <div class="game-loader-grid" aria-hidden="true" />

    <div class="game-loader-inner">
      <div class="game-loader-brand">
        <!-- Large early text paint helps LCP settle on the loader instead of a late WebGL canvas. -->
        <h1 id="game-loader-title" class="game-loader-name">
          {{ appTitle }}
        </h1>
        <p class="game-loader-tagline">Portfolio</p>
      </div>

      <div
        class="game-loader-bar-wrap"
        role="progressbar"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-valuenow="clampedProgress"
        :aria-label="`Loading ${clampedProgress} percent`"
      >
        <div class="game-loader-bar-track">
          <div
            class="game-loader-bar-fill"
            :style="{ width: `${clampedProgress}%` }"
          >
            <span class="game-loader-bar-shine" />
          </div>
        </div>
      </div>

      <div class="game-loader-footer">
        <p class="game-loader-pct" aria-hidden="true">
          <span class="game-loader-pct-value">{{ paddedPercent }}</span>
          <span class="game-loader-pct-suffix">%</span>
        </p>
        <div class="game-loader-footer-body">
          <p v-if="!loadingComplete" class="game-loader-hint">Preparing experience</p>
          <button
            v-else
            type="button"
            class="game-loader-start"
            @click="emit('start')"
          >
            <span class="game-loader-start-bg" aria-hidden="true" />
            <span class="game-loader-start-label">Enter</span>
            <span class="game-loader-start-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppConfig } from '@/composables/useAppConfig';

const props = defineProps<{
  progress: number;
  loadingComplete: boolean;
}>();

const emit = defineEmits<{
  start: [];
}>();

const { appTitle } = useAppConfig();

const clampedProgress = computed(() =>
  Math.max(0, Math.min(100, Math.round(props.progress))),
);

const paddedPercent = computed(() =>
  String(clampedProgress.value).padStart(3, '0'),
);
</script>

<style scoped>
.game-loader {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: #060606;
  color: #e8e8e8;
  font-family: var(--font-primary, system-ui, sans-serif);
  -webkit-font-smoothing: antialiased;
}

/* Spotlight + vignette (matches main site mood) */
.game-loader-ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 85% 55% at 50% 8%,
    rgba(255, 255, 255, 0.14) 0%,
    rgba(120, 120, 120, 0.06) 28%,
    transparent 62%
  );
  animation: game-loader-glow 10s ease-in-out infinite alternate;
}

.game-loader-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 120% 80% at 50% 100%, transparent 0%, rgba(0, 0, 0, 0.55) 100%);
}

.game-loader-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.04;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%);
}

@keyframes game-loader-glow {
  0% {
    opacity: 0.85;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1.02);
  }
}

.game-loader-inner {
  position: relative;
  z-index: 1;
  width: min(100%, 26rem);
  min-height: min(42vh, 20rem);
  padding: 2.25rem 2rem 2rem;
  text-align: center;
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.07) 0%,
    rgba(255, 255, 255, 0.02) 45%,
    rgba(0, 0, 0, 0.2) 100%
  );
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.35) inset,
    0 24px 56px rgba(0, 0, 0, 0.45),
    0 0 80px rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

/* Backdrop blur is costly on mobile GPU; LCP paints sooner without it below lg. */
@media (max-width: 1023px) {
  .game-loader-inner {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

.game-loader-brand {
  margin-bottom: 1.75rem;
}

/* System stack first: webfonts must not block LCP paint on the loader title. */
.game-loader-name {
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  font-size: clamp(1.75rem, 6.5vw, 2.35rem);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fafafa;
  line-height: 1.2;
}

.game-loader-tagline {
  margin: 0.35rem 0 0;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.38em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);
}

.game-loader-bar-wrap {
  margin-bottom: 1.25rem;
}

.game-loader-bar-track {
  position: relative;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.game-loader-bar-fill {
  position: relative;
  height: 100%;
  min-width: 0;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.55) 0%,
    #ffffff 40%,
    rgba(230, 230, 230, 0.95) 100%
  );
  box-shadow:
    0 0 16px rgba(255, 255, 255, 0.35),
    0 0 32px rgba(255, 255, 255, 0.12);
  transition: width 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.game-loader-bar-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgba(255, 255, 255, 0.45) 45%,
    transparent 65%
  );
  transform: translateX(-100%);
  animation: game-loader-shine 2.2s ease-in-out infinite;
}

@keyframes game-loader-shine {
  0% {
    transform: translateX(-120%);
  }
  55%,
  100% {
    transform: translateX(120%);
  }
}

.game-loader-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  min-height: 4.25rem;
  justify-content: flex-start;
}

/* Fixed slot so hint ↔ Enter swap doesn’t change footer height (CLS). */
.game-loader-footer-body {
  min-height: 3.25rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-loader-pct {
  margin: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.15rem;
  font-family: ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace;
}

.game-loader-pct-value {
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: #fff;
  text-shadow: 0 0 40px rgba(255, 255, 255, 0.12);
  font-variant-numeric: tabular-nums;
}

.game-loader-pct-suffix {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.35);
}

.game-loader-hint {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

/* Button: chrome rail */
.game-loader-start {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0;
  padding: 0.85rem 1.75rem;
  min-width: 11rem;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #0a0a0a;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.25s ease;
}

.game-loader-start-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #ffffff 0%, #d4d4d4 100%);
  border-radius: inherit;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.5) inset,
    0 4px 20px rgba(255, 255, 255, 0.2);
  z-index: 0;
  transition: filter 0.2s ease;
}

.game-loader-start:hover .game-loader-start-bg {
  filter: brightness(1.06);
}

.game-loader-start-label,
.game-loader-start-arrow {
  position: relative;
  z-index: 1;
}

.game-loader-start-arrow {
  font-size: 1rem;
  letter-spacing: 0;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.game-loader-start:hover .game-loader-start-arrow {
  transform: translateX(4px);
}

.game-loader-start:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.85);
  outline-offset: 4px;
}

.game-loader-start:active {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .game-loader-ambient,
  .game-loader-bar-shine {
    animation: none;
  }

  .game-loader-bar-fill {
    transition: none;
  }

  .game-loader-start {
    transition: none;
  }
}
</style>
