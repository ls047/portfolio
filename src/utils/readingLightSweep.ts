import { ref } from 'vue';

/**
 * Shared phase for the CCTV ↔ reading-light sweep (rad).
 * Layout advances it while content is visible; `getLightCenterPx` maps sin(phase) → X wobble.
 */
export const readingLightSweepPhase = ref(0);

/** Angular speed (rad/s). One full L↔R cycle ≈ 2π / this. */
export const READING_LIGHT_SWEEP_SPEED_RAD_S = 0.38;

/**
 * +1: dome yaw tracks horizontal glow motion (u>0 when spotlight is right of its sweep center).
 * −1: flip if your GLB’s +Y rotation reads opposite to screen motion.
 */
export const SWEEP_YAW_LIGHT_COUPLE_SIGN = 1;
