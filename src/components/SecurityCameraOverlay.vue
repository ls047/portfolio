<template>
  <div
    class="cctv-root"
    aria-hidden="true"
  >
    <!-- Subtle monitor tint + grain (no @apply) -->
    <div class="cctv-color-grade" />
    <div class="cctv-grain" />

    <!-- Scanlines -->
    <div
      class="cctv-scanlines"
      :class="{ 'cctv-scanlines--static': reducedMotion }"
    />

    <!-- Vignette + inner bezel -->
    <div class="cctv-vignette" />
    <div class="cctv-inner-frame" />

    <!-- Corner brackets -->
    <div class="cctv-corner cctv-corner--tl" />
    <div class="cctv-corner cctv-corner--tr" />
    <div class="cctv-corner cctv-corner--bl" />
    <div class="cctv-corner cctv-corner--br" />

    <!-- HUD: top bar -->
    <div class="cctv-hud-top">
      <div class="cctv-hud-left">
        <span class="cctv-rec">
          <span
            class="cctv-rec-dot"
            :class="{ 'cctv-rec-dot--pulse': !reducedMotion }"
          />
          REC
        </span>
        <span class="cctv-divider" />
        <span class="cctv-cam-id">PORTFOLIO · NODE-SEC-01</span>
      </div>
      <div class="cctv-hud-right">
        <span class="cctv-signal" aria-hidden="true">
          <span
            v-for="i in 5"
            :key="i"
            class="cctv-signal-bar"
            :style="{ height: `${6 + i * 3}px` }"
          />
        </span>
        <span class="cctv-divider" />
        <span class="cctv-time">{{ timeLine }}</span>
      </div>
    </div>

    <!-- HUD: bottom status -->
    <div class="cctv-hud-bottom">
      <span>FEED · PRIMARY</span>
      <span class="cctv-hud-bottom-mid">ENC · AES-256 · SESSION OK</span>
      <span class="cctv-res">{{ viewportLabel }}</span>
    </div>

    <!-- Focus / reticle (very subtle) -->
    <div class="cctv-reticle" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const timeLine = ref('');
const viewportLabel = ref('1920 × 1080');
const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let intervalId = 0;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function updateClock() {
  const d = new Date();
  const utc = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())} UTC`;
  const day = pad2(d.getUTCDate());
  const mon = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getUTCMonth()] ?? '';
  const yr = d.getUTCFullYear();
  timeLine.value = `${day} ${mon} ${yr}  ${utc}`;
}

function updateViewportLabel() {
  if (typeof window === 'undefined') return;
  viewportLabel.value = `${window.innerWidth} × ${window.innerHeight}`;
}

onMounted(() => {
  updateClock();
  updateViewportLabel();
  intervalId = window.setInterval(updateClock, 1000);
  window.addEventListener('resize', updateViewportLabel, { passive: true });
});

onUnmounted(() => {
  clearInterval(intervalId);
  window.removeEventListener('resize', updateViewportLabel);
});
</script>

<style scoped>
/* Full viewport, never steals pointer events */
.cctv-root {
  position: fixed;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  overflow: hidden;
}

/* Cool desaturated security monitor cast */
.cctv-color-grade {
  position: absolute;
  inset: 0;
  background: rgba(35, 55, 48, 0.06);
  mix-blend-mode: multiply;
  pointer-events: none;
}

/* Film grain */
.cctv-grain {
  position: absolute;
  inset: -20%;
  opacity: 0.07;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
  animation: cctv-grain-shift 0.5s steps(2) infinite;
}

.cctv-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.09) 0px,
    rgba(0, 0, 0, 0.09) 1px,
    transparent 1px,
    transparent 3px
  );
  opacity: 0.35;
  pointer-events: none;
  animation: cctv-scan-drift 9s linear infinite;
}

.cctv-scanlines--static {
  animation: none;
}

.cctv-vignette {
  position: absolute;
  inset: 0;
  box-shadow:
    inset 0 0 120px rgba(0, 0, 0, 0.45),
    inset 0 0 40px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.cctv-inner-frame {
  position: absolute;
  /* Flush to viewport corners when safe-area is 0; inset only for notch / home indicator */
  inset: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0)
    env(safe-area-inset-left, 0);
  border: 1px solid rgba(180, 255, 200, 0.12);
  border-radius: 0;
  box-shadow:
    inset 0 0 30px rgba(0, 20, 10, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

/* L-shaped corners */
.cctv-corner {
  position: absolute;
  width: min(8vw, 56px);
  height: min(8vw, 56px);
  border-color: rgba(160, 240, 180, 0.45);
  border-style: solid;
  border-width: 0;
  pointer-events: none;
  filter: drop-shadow(0 0 4px rgba(100, 255, 160, 0.15));
}

.cctv-corner--tl {
  top: env(safe-area-inset-top, 0);
  left: env(safe-area-inset-left, 0);
  border-top-width: 2px;
  border-left-width: 2px;
  border-radius: 3px 0 0 0;
}

.cctv-corner--tr {
  top: env(safe-area-inset-top, 0);
  right: env(safe-area-inset-right, 0);
  border-top-width: 2px;
  border-right-width: 2px;
  border-radius: 0 3px 0 0;
}

.cctv-corner--bl {
  bottom: env(safe-area-inset-bottom, 0);
  left: env(safe-area-inset-left, 0);
  border-bottom-width: 2px;
  border-left-width: 2px;
  border-radius: 0 0 0 3px;
}

.cctv-corner--br {
  bottom: env(safe-area-inset-bottom, 0);
  right: env(safe-area-inset-right, 0);
  border-bottom-width: 2px;
  border-right-width: 2px;
  border-radius: 0 0 3px 0;
}

.cctv-hud-top {
  position: absolute;
  top: env(safe-area-inset-top, 0);
  left: max(12px, env(safe-area-inset-left, 0));
  right: max(12px, env(safe-area-inset-right, 0));
  padding-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: clamp(0.62rem, 1.35vw, 0.72rem);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(200, 245, 210, 0.88);
  text-shadow:
    0 0 8px rgba(0, 80, 40, 0.35),
    0 1px 0 rgba(0, 0, 0, 0.8);
  pointer-events: none;
}

.cctv-hud-left,
.cctv-hud-right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cctv-rec {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: rgba(255, 120, 120, 0.95);
}

.cctv-rec-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4444;
  box-shadow: 0 0 8px rgba(255, 60, 60, 0.9);
}

.cctv-rec-dot--pulse {
  animation: cctv-rec-blink 1.2s ease-in-out infinite;
}

.cctv-divider {
  width: 1px;
  height: 12px;
  background: rgba(160, 230, 180, 0.35);
}

.cctv-cam-id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(42vw, 240px);
  color: rgba(190, 248, 210, 0.92);
}

.cctv-signal {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 22px;
}

.cctv-signal-bar {
  width: 3px;
  background: rgba(120, 220, 160, 0.65);
  border-radius: 1px;
  box-shadow: 0 0 4px rgba(80, 200, 120, 0.3);
}

.cctv-time {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: none;
  color: rgba(210, 250, 220, 0.9);
  white-space: nowrap;
}

.cctv-hud-bottom {
  position: absolute;
  bottom: env(safe-area-inset-bottom, 0);
  left: max(12px, env(safe-area-inset-left, 0));
  right: max(12px, env(safe-area-inset-right, 0));
  padding-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  font-family: var(--font-display), var(--font-secondary), system-ui, sans-serif;
  font-size: clamp(0.55rem, 1.15vw, 0.65rem);
  letter-spacing: 0.125rem;
  text-transform: uppercase;
  color: rgba(170, 230, 195, 0.65);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
  pointer-events: none;
}

.cctv-hud-bottom-mid {
  flex: 1;
  text-align: center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Phones / narrow tablets: single-line HUD inside frame — smaller type, tighter tracking, no wrap */
@media (max-width: 1023px) {
  .cctv-hud-top {
    flex-wrap: nowrap;
    gap: 5px;
    padding-top: 8px;
    left: max(8px, env(safe-area-inset-left, 0));
    right: max(8px, env(safe-area-inset-right, 0));
    font-size: clamp(0.44rem, 2.35vw, 0.58rem);
    letter-spacing: 0.04em;
  }

  .cctv-hud-left {
    flex: 1 1 0;
    gap: 4px;
    min-width: 0;
  }

  .cctv-hud-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .cctv-rec {
    gap: 3px;
    flex-shrink: 0;
  }

  .cctv-rec-dot {
    width: 5px;
    height: 5px;
  }

  .cctv-divider {
    height: 10px;
    flex-shrink: 0;
  }

  .cctv-cam-id {
    max-width: unset;
    flex: 1;
    min-width: 0;
    font-size: clamp(0.42rem, 2.2vw, 0.54rem);
  }

  .cctv-signal {
    height: 16px;
    flex-shrink: 0;
    transform: scaleY(0.82);
    transform-origin: bottom center;
  }

  .cctv-time {
    font-size: clamp(0.42rem, 2.1vw, 0.54rem);
    flex-shrink: 0;
    letter-spacing: 0.02em;
  }

  .cctv-hud-bottom {
    flex-wrap: nowrap;
    gap: 4px;
    padding-bottom: 8px;
    left: max(8px, env(safe-area-inset-left, 0));
    right: max(8px, env(safe-area-inset-right, 0));
    font-size: clamp(0.4rem, 2.15vw, 0.52rem);
    letter-spacing: 0.05em;
  }

  .cctv-hud-bottom > span:first-child,
  .cctv-res {
    flex-shrink: 0;
  }

  .cctv-hud-bottom-mid {
    display: block;
    flex: 1 1 0;
    min-width: 0;
  }

  .cctv-res {
    font-size: clamp(0.38rem, 2vw, 0.5rem);
  }
}

.cctv-res {
  font-variant-numeric: tabular-nums;
  color: rgba(150, 210, 175, 0.55);
}

/* Subtle center reticle */
.cctv-reticle {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 28vh;
  max-width: 200px;
  height: 28vh;
  max-height: 200px;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(140, 220, 170, 0.07);
  border-radius: 50%;
  pointer-events: none;
}

.cctv-reticle::before,
.cctv-reticle::after {
  content: '';
  position: absolute;
  background: rgba(140, 220, 170, 0.06);
}

.cctv-reticle::before {
  left: 50%;
  top: 15%;
  bottom: 15%;
  width: 1px;
  transform: translateX(-50%);
}

.cctv-reticle::after {
  top: 50%;
  left: 15%;
  right: 15%;
  height: 1px;
  transform: translateY(-50%);
}

@keyframes cctv-rec-blink {
  0%,
  45% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0.35;
  }
}

@keyframes cctv-scan-drift {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(4px);
  }
}

@keyframes cctv-grain-shift {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-1%, 1%);
  }
  100% {
    transform: translate(1%, -1%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cctv-scanlines {
    animation: none;
  }

  .cctv-grain {
    animation: none;
  }

  .cctv-rec-dot--pulse {
    animation: none;
    opacity: 0.95;
  }
}
</style>
