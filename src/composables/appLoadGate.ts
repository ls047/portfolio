import { ref } from 'vue';

/** True after car GLB is in the scene and first frame drawn, or after WebGL/GLB fallback. */
export const carIntroSceneReady = ref(false);

/** User clicked Enter — start the WebGL car intro (heavy path only). */
export const carIntroStartRequested = ref(false);
